module L = Hw2_loa_logic

type player = L.player = Black | White
type cell   = L.cell   = Empty | Piece of player
type coord  = L.coord  = { r : int; c : int }
type board  = L.board
type state  = L.state
type move_  = L.move_  = { from_ : coord; to_ : coord }  (* <-- IMPORTANT *)

let board_size  = L.board_size
let legal_move  = L.legal_move
let make_move   = L.make_move
let is_winner   = L.is_winner

let initial_state = Hw1.initial_state
