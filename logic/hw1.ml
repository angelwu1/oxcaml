(* logic/hw1.ml *)
open Hw2_loa_logic  (* reuse the exact types from HW2 *)

let e = Empty
let b = Piece Black
let w = Piece White

let initial_board : board =
  [
    [e; b; b; b; b; b; b; e];
    [w; e; e; e; e; e; e; w];
    [w; e; e; e; e; e; e; w];
    [w; e; e; e; e; e; e; w];
    [w; e; e; e; e; e; e; w];
    [w; e; e; e; e; e; e; w];
    [w; e; e; e; e; e; e; w];
    [e; b; b; b; b; b; b; e];
  ]

let initial_state : state = { board = initial_board; turn = Black }

let example_move1 : move_ = { from_ = { r = 0; c = 1 }; to_ = { r = 2; c = 1 } }
let example_move2 : move_ = { from_ = { r = 7; c = 6 }; to_ = { r = 5; c = 6 } }

let state_after_1 : state =
  {
    board =
      [
        [ e; e; b; b; b; b; b; e ];
        [ w; e; e; e; e; e; e; w ];
        [ w; b; e; e; e; e; e; w ];
        [ w; e; e; e; e; e; e; w ];
        [ w; e; e; e; e; e; e; w ];
        [ w; e; e; e; e; e; e; w ];
        [ w; e; e; e; e; e; e; w ];
        [ e; b; b; b; b; b; b; e ];
      ];
    turn = White;
  }

let state_after_2 : state =
  {
    board =
      [
        [ e; e; b; b; b; b; b; e ];
        [ e; e; w; e; e; e; e; w ];
        [ w; b; e; e; e; e; e; w ];
        [ w; e; e; e; e; e; e; w ];
        [ w; e; e; e; e; e; e; w ];
        [ w; e; e; e; e; e; e; w ];
        [ w; e; e; e; e; e; e; w ];
        [ e; b; b; b; b; b; b; e ];
      ];
    turn = Black;
  }
