open! Core
open Loa_logic_library
open Hw4_alpha_beta_search

let%expect_test "alpha_beta_depth returns some legal move from initial state" =
  let mv = alpha_beta_depth initial_state ~depth:2 in
  assert (Option.is_some mv);
  [%expect {| |}]

let%expect_test "random_move returns some legal move from initial state" =
  let mv = random_move initial_state in
  assert (Option.is_some mv);
  [%expect {| |}]

let%test_unit "timed alpha-beta returns within ~2s and gives a move" =
  let start = Time_float.now () in
  let mv = alpha_beta_timed initial_state ~time_budget:(Time_float.Span.of_sec 2.) in
  let span = Time_float.diff (Time_float.now ()) start in
  assert Time_float.Span.(span <= of_sec 2.5);
  assert (Option.is_some mv)

let%test_unit "play 10 games random vs alpha-beta (fast) completes" =
  Random.init 42;
  let p_rand st = random_move st in
  let p_ab st = alpha_beta_depth st ~depth:2 in
  let b, w, d = run_many_games 10 ~p_black:p_ab ~p_white:p_rand in
  ignore (b, w, d)
