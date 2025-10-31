open! Core
open Loa_logic_library

(** Returns a random legal move for the current player, or [None] if no moves. *)
val random_move : state -> move_ option

(** Alpha-beta search with a fixed depth limit; returns the best move found or [None]
    if there are no legal moves or the position is terminal. *)
val alpha_beta_depth : state -> depth:int -> move_ option

(** Iterative deepening alpha-beta that searches increasing depths until [time_budget]
    elapses (soft deadline). Returns the best move found so far, or [None] if no move. *)
val alpha_beta_timed : state -> time_budget:Time_float.Span.t -> move_ option

(** Play a single game between two opponents; each opponent is a function from state
    to move. To protect against slow opponents, each move function is wrapped with a
    [Time_float.Span.t] budget; if it returns [None] or times out, the player loses. *)
val play_game
  :  ?move_time_budget:Time_float.Span.t
  -> initial:state
  -> p_black:(state -> move_ option)
  -> p_white:(state -> move_ option)
  -> player option  (** winner or [None] if stalemate/invalid *)

(** Run [n] games between two opponents from the standard LOA initial state.
    Returns (black_wins, white_wins, draws). *)
val run_many_games
  :  ?move_time_budget:Time_float.Span.t
  -> int
  -> p_black:(state -> move_ option)
  -> p_white:(state -> move_ option)
  -> int * int * int
