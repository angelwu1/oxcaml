open Core
open Loa_logic_library

let ok_exn = Result.ok_or_failwith

let pp_cell (x : Loa_logic_library.cell) =
  let open Loa_logic_library in
  match x with
  | Empty -> '.'
  | Piece Black -> 'B'
  | Piece White -> 'W'

let board_to_string (b : board) : string =
  b
  |> List.map ~f:(fun row -> row |> List.map ~f:pp_cell |> String.of_char_list)
  |> String.concat ~sep:"\n"

let pretty_print_board (st : state) =
  printf "turn=%s\n" (match st.turn with Black -> "Black" | White -> "White");
  print_endline (board_to_string st.board)


let m fr_r fr_c to_r to_c : move_ =
  { from_ = { r = fr_r; c = fr_c }
  ; to_   = { r = to_r;  c = to_c } }

(* ---- HW1 state sanity ---- *)
let%expect_test "initial board shape & counts" =
  let st = initial_state in
  printf "turn=%s\n" (match st.turn with Black->"Black" | White->"White");
  printf "rows=%d cols=%d\n"
    (List.length st.board)
    (List.length (List.hd_exn st.board));
  let count p =
    List.concat st.board
    |> List.count ~f:(function Piece q when phys_equal q p -> true | _ -> false)
  in
  printf "black=%d white=%d\n" (count Black) (count White);
  print_endline (board_to_string st.board);
  [%expect {|
    turn=Black
    rows=8 cols=8
    black=12 white=12
    .BBBBBB.
    W......W
    W......W
    W......W
    W......W
    W......W
    W......W
    .BBBBBB. |}]

(* ---- Illegalities ---- *)
let%test "illegal: same square" =
  match legal_move initial_state (m 0 1 0 1) with
  | Error Same_square -> true | _ -> false

let%test "illegal: no piece at source" =
  match legal_move initial_state (m 3 3 3 4) with
  | Error No_piece_at_source -> true | _ -> false

let%test "illegal: destination has own piece" =
  match legal_move initial_state (m 0 1 0 2) with
  | Error Destination_has_own_piece -> true | _ -> false

let%test "illegal: not aligned" =
  match legal_move initial_state (m 0 1 1 3) with
  | Error Not_aligned -> true | _ -> false

(* ---- A simple legal move and its effect ---- *)
let%expect_test "legal horizontal move from top row" =
  let st0 = initial_state in
  let mv = m 0 6 0 0 in
  assert (Result.is_ok (legal_move st0 mv));
  match make_move st0 mv with
  | Error _ -> assert false
  | Ok st1 ->
      printf "next=%s\n" (match st1.turn with Black->"Black"|White->"White");
      print_endline (board_to_string st1.board);
      [%expect {|
        next=White
        BBBBBB..
        W......W
        W......W
        W......W
        W......W
        W......W
        W......W
        .BBBBBB. |}]

(* ---- Light random exploration ---- *)
let all_coords =
  List.init board_size ~f:(fun r -> List.init board_size ~f:(fun c -> {r;c}))
  |> List.concat

let cell_at (b : board) r c =
  let row = List.nth_exn b r in
  List.nth_exn row c

let player_pieces (st : state) (p : player) : coord list =
  all_coords
  |> List.filter ~f:(fun q ->
         match cell_at st.board q.r q.c with
         | Piece p' when phys_equal p' p -> true
         | _ -> false)

let legal_moves_from (st : state) (src : coord) : move_ list =
  all_coords
  |> List.filter_map ~f:(fun dst ->
         match legal_move st { from_ = src; to_ = dst } with
         | Ok () -> Some { from_ = src; to_ = dst }
         | Error _ -> None)

let%test "random walk: alternates turns and stays in-bounds" =
  let rec step k st =
    if k = 0 then true
    else
      let pieces = player_pieces st st.turn in
      let moves = List.concat_map pieces ~f:(legal_moves_from st) in
      match moves with
      | [] -> true
      | _ ->
          let mv = List.nth_exn moves (Random.int (List.length moves)) in
          match make_move st mv with
          | Error _ -> false
          | Ok st' -> (not (phys_equal st'.turn st.turn)) && step (k-1) st'
  in
  step 20 initial_state
