(** HW2 — Lines of Action (LoA): legality, state transition, and win check *)

type player = Black | White
type cell = Empty | Piece of player

(** 0-based board coordinates (row, col), each in [0..7] *)
type coord = { r : int; c : int }

(** Board is a list of rows (8 rows), each a list of 8 cells. *)
type board = cell list list

type state = {
  board : board;
  turn  : player;   (** player to move *)
}

type move_ = { from_ : coord; to_ : coord }

val board_size : int

(** Reasons a move can be rejected. *)
type move_error =
  | Out_of_bounds
  | No_piece_at_source
  | Not_your_turn
  | Same_square
  | Destination_has_own_piece
  | Not_aligned                         (** not a rank/file/diagonal move *)
  | Wrong_distance of { required:int; got:int }  (** LoA distance rule *)
  | Blocked_by_opponent                 (** may jump own pieces, not opponent *)

(** Check if a move is legal under LoA rules. *)
val legal_move : state -> move_ -> (unit, move_error) result

(** Apply a legal move (with capture if any) and switch the turn. *)
val make_move : state -> move_ -> (state, move_error) result

(** True iff [p]’s pieces form one 8-neighbor-connected group. *)
val is_winner : state -> player -> bool
