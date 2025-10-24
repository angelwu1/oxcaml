(** HW1 — Lines of Action (LoA): types and example values *)

type player = Black | White

type cell =
  | Empty
  | Piece of player

(** 0-based board coordinates (row, col) with rows/cols in [0..7] *)
type coord = { r : int; c : int }

(** Board as a list of rows, each a list of cells (8×8). *)
type board = cell list list

(** Minimal game state for HW1: board + whose turn *)
type state = {
  board : board;
  turn  : player;
}

(** A move is just from→to coordinates (legality checked later HWs). *)
type move_ = { from_ : coord; to_ : coord }

(** Standard LoA initial position:
    - Black pieces on top & bottom rows except corners
    - White pieces on left & right columns except corners
    - All corners empty
*)
val initial_board : board
val initial_state : state

(** Example moves (not asserting legality in HW1): *)
val example_move1 : move_
val example_move2 : move_

(** A couple of example “post-move” states, hard-coded for slides.
    (These are just illustrative values for HW1, not computed.) *)
val state_after_1 : state
val state_after_2 : state
