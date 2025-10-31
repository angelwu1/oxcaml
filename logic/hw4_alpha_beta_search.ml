open! Core
open Hw2_loa_logic

let other = function Black -> White | White -> Black

let all_coords : coord list =
  List.init board_size ~f:(fun r -> List.init board_size ~f:(fun c -> { r; c }))
  |> List.concat

let get_cell (b:board) (p:coord) : cell option =
  List.nth b p.r |> Option.bind ~f:(fun row -> List.nth row p.c)

let current_player_pieces (st:state) : coord list =
  let who = st.turn in
  List.filter all_coords ~f:(fun p ->
    match get_cell st.board p with Some (Piece pl) when Poly.equal pl who -> true | _ -> false)

let all_legal_moves (st:state) : move_ list =
  (* Naively try all destinations for each of our pieces and filter by legal_move. *)
  let froms = current_player_pieces st in
  List.concat_map froms ~f:(fun from_ ->
    List.filter_map all_coords ~f:(fun to_ ->
      if from_.r = to_.r && from_.c = to_.c then None
      else
        match legal_move st { from_; to_ } with
        | Ok () -> Some { from_; to_ }
        | Error _ -> None))

(* Heuristic helpers: size of the largest 8-neighbor connected component per player. *)
let neighbors8 (p:coord) : coord list =
  [ {r=p.r-1;c=p.c-1}; {r=p.r-1;c=p.c}; {r=p.r-1;c=p.c+1}
  ; {r=p.r  ;c=p.c-1};                   {r=p.r  ;c=p.c+1}
  ; {r=p.r+1;c=p.c-1}; {r=p.r+1;c=p.c}; {r=p.r+1;c=p.c+1}
  ]
  |> List.filter ~f:(fun {r;c} -> 0 <= r && r < board_size && 0 <= c && c < board_size)

let largest_component_size (st:state) (pl:player) : int =
  let pieces =
    List.filter all_coords ~f:(fun p -> match get_cell st.board p with Some (Piece q) when Poly.equal q pl -> true | _ -> false)
  in
  let module H = Hashtbl.Poly in
  let seen = H.create () in
  let in_seen (q:coord) = H.mem seen (q.r, q.c) in
  let add_seen (q:coord) = ignore (H.add seen ~key:(q.r, q.c) ~data:()) in
  let rec bfs acc = function
    | [] -> acc
    | q::qs ->
      if in_seen q then bfs acc qs
      else (
        add_seen q;
        let neighbors =
          neighbors8 q
          |> List.filter ~f:(fun t -> match get_cell st.board t with Some (Piece p) when Poly.equal p pl -> not (in_seen t) | _ -> false)
        in
        bfs (acc + 1) (List.rev_append neighbors qs))
  in
  let rec loop max_size = function
    | [] -> max_size
    | p::ps ->
      if in_seen p then loop max_size ps
      else
        let size = bfs 0 [p] in
        loop (Int.max max_size size) ps
  in
  loop 0 pieces

let is_terminal (st:state) : player option =
  if is_winner st Black then Some Black
  else if is_winner st White then Some White
  else None

let heuristic_value (st:state) : int =
  (* From Black's perspective: large positive means good for Black. *)
  let black_size = largest_component_size st Black in
  let white_size = largest_component_size st White in
  (* Prefer positions closer to connectivity and penalize opponent. *)
  (black_size - white_size)

let child_states (st:state) : (move_ * state) list =
  all_legal_moves st
  |> List.filter_map ~f:(fun mv -> make_move st mv |> Result.ok |> Option.map ~f:(fun s' -> (mv, s')))

let rec alphabeta_value (st:state) ~(depth:int) ~(alpha:int) ~(beta:int) : int =
  match is_terminal st, depth with
  | Some Black, _ -> Int.max_value
  | Some White, _ -> Int.min_value
  | None, d when d <= 0 -> heuristic_value st
  | None, _ ->
    let maximizing = Poly.equal st.turn Black in
    if maximizing then (
      let rec max_loop best a = function
        | [] -> best
        | (_mv, child)::rest ->
          let v = Int.max best (alphabeta_value child ~depth:(depth-1) ~alpha:a ~beta) in
          let a' = Int.max a v in
          if v >= beta then v else max_loop v a' rest
      in
      max_loop Int.min_value alpha (child_states st)
    ) else (
      let rec min_loop best b = function
        | [] -> best
        | (_mv, child)::rest ->
          let v = Int.min best (alphabeta_value child ~depth:(depth-1) ~alpha ~beta:b) in
          let b' = Int.min b v in
          if v <= alpha then v else min_loop v b' rest
      in
      min_loop Int.max_value beta (child_states st))

let alpha_beta_depth (st:state) ~(depth:int) : move_ option =
  match is_terminal st with
  | Some _ -> None
  | None ->
    let moves = child_states st in
    let scored =
      List.map moves ~f:(fun (mv, child) -> mv, alphabeta_value child ~depth:(depth-1) ~alpha:Int.min_value ~beta:Int.max_value)
    in
    let cmp = if Poly.equal st.turn Black then Int.compare else (fun a b -> Int.compare b a) in
    List.max_elt scored ~compare:(fun (_m1, v1) (_m2, v2) -> cmp v1 v2)
    |> Option.map ~f:fst

let random_move (st:state) : move_ option =
  let moves = all_legal_moves st in
  match moves with
  | [] -> None
  | _ ->
    let idx = Random.int (List.length moves) in
    Some (List.nth_exn moves idx)

let alpha_beta_timed (st:state) ~(time_budget:Time_float.Span.t) : move_ option =
  let deadline = Time_float.(add (now ()) time_budget) in
  let rec deepen depth best =
    if Time_float.(now () >= deadline) then best
    else
      let next = alpha_beta_depth st ~depth in
      let best = Option.first_some next best in
      deepen (depth + 1) best
  in
  deepen 1 None

let play_game
    ~(move_time_budget:Time_float.Span.t)
    ~(initial:state)
    ~(p_black:(state -> move_ option))
    ~(p_white:(state -> move_ option))
  : player option =
  let rec loop st turn move_count =
    if is_winner st Black then Some Black
    else if is_winner st White then Some White
    else if move_count > 1024 then None (* safeguard *)
    else
      let chooser = if Poly.equal turn Black then p_black else p_white in
      let start = Time_float.now () in
      let get_move () =
        if Time_float.(now () > add start move_time_budget) then None
        else chooser st
      in
      match get_move () with
      | None -> Some (other turn) (* forfeits due to timeout/no move *)
      | Some mv -> (
          match make_move st mv with
          | Error _ -> Some (other turn) (* illegal move forfeits *)
          | Ok st' -> loop st' (other turn) (move_count + 1))
  in
  loop initial initial.turn 0

let run_many_games
    ?(move_time_budget=Time_float.Span.of_sec 2.)
    n ~p_black ~p_white : int * int * int =
  let rec go i b w d =
    if i = n then b, w, d
    else
      let winner =
        play_game ~move_time_budget ~initial:Hw1.initial_state ~p_black ~p_white
      in
      match winner with
      | Some Black -> go (i+1) (b+1) w d
      | Some White -> go (i+1) b (w+1) d
      | None -> go (i+1) b w (d+1)
  in
  go 0 0 0 0
