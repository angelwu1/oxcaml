(** HW2 — Lines of Action (LoA) *)

type player = Black | White
type cell = Empty | Piece of player
type coord = { r:int; c:int }
type board = cell list list

type state = { board: board; turn: player }
type move_ = { from_: coord; to_: coord }

type move_error =
  | Out_of_bounds
  | No_piece_at_source
  | Not_your_turn
  | Same_square
  | Destination_has_own_piece
  | Not_aligned
  | Wrong_distance of { required:int; got:int }
  | Blocked_by_opponent

let board_size = 8

(* ---------- list-of-lists helpers ---------- *)

let in_bounds {r;c} =
  0 <= r && r < board_size && 0 <= c && c < board_size

let nth_opt lst i =
  if i < 0 then None
  else
    let rec go j = function
      | [] -> None
      | x::xs -> if j = 0 then Some x else go (j-1) xs
    in
    go i lst

let get_cell (b:board) (p:coord) : cell option =
  match nth_opt b p.r with
  | None -> None
  | Some row -> nth_opt row p.c

let set_cell (b:board) (p:coord) (v:cell) : board =
  let rec set_i i = function
    | [] -> []
    | x::xs -> if i=0 then v::xs else x :: set_i (i-1) xs
  in
  let rec set_r ri = function
    | [] -> []
    | row::rs -> if ri=0 then set_i p.c row :: rs else row :: set_r (ri-1) rs
  in
  set_r p.r b

let other = function Black -> White | White -> Black

(* ---------- LoA geometry ---------- *)

let direction_between (a:coord) (b:coord) : (int*int) option =
  let dr = b.r - a.r and dc = b.c - a.c in
  let norm x = if x=0 then 0 else if x>0 then 1 else -1 in
  if dr=0 || dc=0 || abs dr = abs dc
  then Some (norm dr, norm dc)
  else None

let add p (dr,dc) = { r = p.r + dr; c = p.c + dc }

(* Count non-empty cells on the full line through [p] in direction [d].
   Includes the starting square if it holds a piece. *)
let count_on_line (b:board) (p:coord) (dr,dc) : int =
  let rec ray acc q step =
    match get_cell b (add q step) with
    | None -> acc
    | Some Empty -> ray acc (add q step) step
    | Some (Piece _) -> ray (acc+1) (add q step) step
  in
  let here = match get_cell b p with Some (Piece _) -> 1 | _ -> 0 in
  here + ray 0 p (dr,dc) + ray 0 p (-dr,-dc)

(* True iff we can go from [from] to [dest] stepping (dr,dc) without crossing
   an opponent piece. Crossing own pieces is allowed; destination handled later. *)
let path_clear (b:board) (who:player) ~(from:coord) ~(dest:coord) (dr,dc) : bool =
  let rec loop q =
    let q' = add q (dr,dc) in
    if q'.r = dest.r && q'.c = dest.c then true
    else
      match get_cell b q' with
      | None -> false
      | Some Empty -> loop q'
      | Some (Piece p) -> if p = who then loop q' else false
  in
  loop from

(* ---------- Legality + Transition ---------- *)

let legal_move (st:state) (m:move_) : (unit, move_error) result =
  if not (in_bounds m.from_ && in_bounds m.to_) then Error Out_of_bounds
  else if m.from_.r = m.to_.r && m.from_.c = m.to_.c then Error Same_square
  else
    match get_cell st.board m.from_ with
    | None | Some Empty -> Error No_piece_at_source
    | Some (Piece who) ->
      if who <> st.turn then Error Not_your_turn
      else
        (* cannot land on own piece *)
        (match get_cell st.board m.to_ with
         | Some (Piece p) when p = who -> Error Destination_has_own_piece
         | _ ->
           match direction_between m.from_ m.to_ with
           | None -> Error Not_aligned
           | Some step ->
             let got =
               max (abs (m.to_.r - m.from_.r)) (abs (m.to_.c - m.from_.c))
             in
             let required = count_on_line st.board m.from_ step in
             if got <> required then Error (Wrong_distance {required; got})
             else if not (path_clear st.board who ~from:m.from_ ~dest:m.to_ step)
             then Error Blocked_by_opponent
             else Ok ())

let make_move (st:state) (m:move_) : (state, move_error) result =
  match legal_move st m with
  | Error e -> Error e
  | Ok () ->
    let who =
      match get_cell st.board m.from_ with
      | Some (Piece p) -> p
      | _ -> failwith "legal_move ensures a piece at source"
    in
    let b'  = set_cell st.board m.from_ Empty in
    let b'' = set_cell b'        m.to_   (Piece who) in
    Ok { board = b''; turn = other who }

(* ---------- Winner check: single connected group ---------- *)

let neighbors8 (p:coord) : coord list =
  [ {r=p.r-1;c=p.c-1}; {r=p.r-1;c=p.c}; {r=p.r-1;c=p.c+1};
    {r=p.r  ;c=p.c-1};                   {r=p.r  ;c=p.c+1};
    {r=p.r+1;c=p.c-1}; {r=p.r+1;c=p.c}; {r=p.r+1;c=p.c+1}; ]
  |> List.filter in_bounds

let pieces_of (b:board) (pl:player) : coord list =
  let rec rows i acc = function
    | [] -> acc
    | row::rs ->
      let rec cols j acc2 = function
        | [] -> acc2
        | x::xs ->
          let acc2 =
            match x with
            | Piece p when p = pl -> {r=i;c=j} :: acc2
            | _ -> acc2
          in
          cols (j+1) acc2 xs
      in
      rows (i+1) (cols 0 acc row) rs
  in
  rows 0 [] b

let is_winner (st:state) (pl:player) : bool =
  match pieces_of st.board pl with
  | [] -> false
  | start::rest ->
    (* DFS from [start], count how many of [pl]'s pieces we can reach *)
    let module H = Hashtbl in
    let seen = H.create 32 in
    let rec dfs acc q =
      if H.mem seen (q.r,q.c) then acc
      else (
        H.add seen (q.r,q.c) ();
        let neigh =
          neighbors8 q
          |> List.filter (fun t -> match get_cell st.board t with Some (Piece p) when p=pl -> true | _ -> false)
        in
        List.fold_left dfs (acc+1) neigh
      )
    in
    let reached = dfs 0 start in
    reached = List.length (start::rest)
