(** HW1 — Lines of Action (LoA): types and example values *)

type player = Black | White

type cell =
  | Empty
  | Piece of player

type coord = { r : int; c : int }

type board = cell list list

type state = {
  board : board;
  turn  : player;
}

type move_ = { from_ : coord; to_ : coord }

(* Shorthand to keep the board literal readable *)
let e = Empty
let b = Piece Black
let w = Piece White

(* LoA initial board (8x8), lists-of-lists literal, rows 0..7 *)
let initial_board : board =
  [
    (* row 0: top, black on 1..6, corners empty *)
    [ e; b; b; b; b; b; b; e ];
    (* rows 1..6: white on col 0 and 7 (excluding corners already covered) *)
    [ w; e; e; e; e; e; e; w ];
    [ w; e; e; e; e; e; e; w ];
    [ w; e; e; e; e; e; e; w ];
    [ w; e; e; e; e; e; e; w ];
    [ w; e; e; e; e; e; e; w ];
    [ w; e; e; e; e; e; e; w ];
    (* row 7: bottom, black on 1..6, corners empty *)
    [ e; b; b; b; b; b; b; e ];
  ]

let initial_state : state = { board = initial_board; turn = Black }

(* Example moves for HW1 (we’re not validating yet) *)
let example_move1 : move_ = { from_ = { r = 0; c = 1 }; to_ = { r = 2; c = 1 } }
let example_move2 : move_ = { from_ = { r = 7; c = 6 }; to_ = { r = 5; c = 6 } }

(* For HW1 we also provide a couple of “after” states as plain values,
   useful for slides and tests. We just tweak the literals. *)

(* state_after_1: move a black piece from (0,1) to (2,1) in the literal *)
let state_after_1 : state =
  let row0 = [ e; e; b; b; b; b; b; e ] in      (* (0,1) becomes Empty *)
  let row2 = [ w; b; e; e; e; e; e; w ] in      (* (2,1) becomes Black *)
  {
    board =
      [
        row0;
        [ w; e; e; e; e; e; e; w ];
        row2;
        [ w; e; e; e; e; e; e; w ];
        [ w; e; e; e; e; e; e; w ];
        [ w; e; e; e; e; e; e; w ];
        [ w; e; e; e; e; e; e; w ];
        [ e; b; b; b; b; b; b; e ];
      ];
    turn = White;
  }

(* state_after_2: then move a white piece from (1,0) to (1,2) *)
let state_after_2 : state =
  let row1 = [ e; e; w; e; e; e; e; w ] in      (* (1,0)->Empty, (1,2)->White *)
  {
    board =
      [
        [ e; e; b; b; b; b; b; e ];
        row1;
        [ w; b; e; e; e; e; e; w ];
        [ w; e; e; e; e; e; e; w ];
        [ w; e; e; e; e; e; e; w ];
        [ w; e; e; e; e; e; e; w ];
        [ w; e; e; e; e; e; e; w ];
        [ e; b; b; b; b; b; b; e ];
      ];
    turn = Black;
  }
