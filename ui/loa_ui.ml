open! Core
open Loa_logic_library
open Virtual_dom
open! Bonsai.Let_syntax

(* Board inspection helpers *)
let all_coords : coord list =
  List.init board_size ~f:(fun r -> List.init board_size ~f:(fun c -> { r; c }))
  |> List.concat

let get_cell (b:board) (p:coord) : cell option =
  List.nth b p.r |> Option.bind ~f:(fun row -> List.nth row p.c)

let all_legal_moves (st:state) : move_ list =
  let is_own_piece q = match get_cell st.board q with Some (Piece pl) when Poly.equal pl st.turn -> true | _ -> false in
  let froms = List.filter all_coords ~f:is_own_piece in
  List.concat_map froms ~f:(fun from_ ->
      List.filter_map all_coords ~f:(fun to_ ->
          if from_.r = to_.r && from_.c = to_.c then None
          else match legal_move st { from_; to_ } with Ok () -> Some { from_; to_ } | Error _ -> None))

(* SVG pieces *)
let viewbox = Vdom.Attr.create "viewBox" "0 0 100 100"

let white_piece =
  Vdom.Node.inner_html_svg
    ~tag:"svg"
    ~attrs:[ viewbox ]
    ~this_html_is_sanitized_and_is_totally_safe_trust_me:
      "<circle cx='50' cy='50' r='40' stroke='black' stroke-width='6' fill='white' />"
    ()

let black_piece =
  Vdom.Node.inner_html_svg
    ~tag:"svg"
    ~attrs:[ viewbox ]
    ~this_html_is_sanitized_and_is_totally_safe_trust_me:
      "<circle cx='50' cy='50' r='40' stroke='black' stroke-width='6' fill='black' />"
    ()

(* Render LOA board *)
let loa_board ~(game_state : state) ~set_game_state:_ =
  let is_game_over = is_winner game_state Black || is_winner game_state White in
  let render_cell ~row ~col =
    let cell_value = get_cell game_state.board { r = row; c = col } in
    let piece_svg, maybe_clickable_attr =
      match cell_value with
      | Some (Piece Black) -> black_piece, Vdom.Attr.empty
      | Some (Piece White) -> white_piece, Vdom.Attr.empty
      | Some Empty | None when is_game_over -> Vdom.Node.none, Vdom.Attr.empty
      | Some Empty | None ->
        (* Empty cell: check if we have a selected piece that can move here *)
        Vdom.Node.none, Vdom.Attr.empty
    in
    let attrs =
      [ Vdom.Attr.class_ "column"
      ; Vdom.Attr.style
          Css_gen.(
            left (`Percent (Percent.of_percentage (Float.of_int col *. 12.5)))
            @> width (`Percent (Percent.of_percentage 12.5))
          )
      ; maybe_clickable_attr
      ]
    in
    let attrs =
      attrs @ if row < board_size - 1 then [ Vdom.Attr.class_ "border_bottom" ] else []
    in
    let attrs =
      attrs @ if col < board_size - 1 then [ Vdom.Attr.class_ "border_right" ] else []
    in
    Vdom.Node.div
      ~attrs
      [ Vdom.Node.div ~attrs:[ Vdom.Attr.class_ "max_size" ] [ piece_svg ] ]
  in
  Vdom.Node.div
    ~attrs:[ Vdom.Attr.class_ "game" ]
    (List.init board_size ~f:(fun row ->
       Vdom.Node.div
         ~attrs:
           [ Vdom.Attr.class_ "row"
           ; Vdom.Attr.style
               Css_gen.(
                 top (`Percent (Percent.of_percentage (Float.of_int row *. 12.5)))
                 @> height (`Percent (Percent.of_percentage 12.5)))
           ]
         (List.init board_size ~f:(fun col -> render_cell ~row ~col))))

let app =
  let%sub game_state, set_game_state =
    Bonsai.state ~default_model:initial_state (module struct
      type t = state
      let sexp_of_t _ = Sexp.Atom "state"
      let t_of_sexp _ = initial_state
      let equal = Poly.equal
    end)
  in
  let%arr game_state = game_state
  and set_game_state = set_game_state in
  Vdom.Node.div
    [ Vdom.Node.div
        ~attrs:[]
        [ Vdom.Node.text
            (sprintf "Turn: %s | Legal moves: %d"
               (match game_state.turn with Black -> "Black" | White -> "White")
               (List.length (all_legal_moves game_state)))
        ]
    ; loa_board ~game_state ~set_game_state
    ; Vdom.Node.div
        ~attrs:[]
        [ Vdom.Node.text
            (if is_winner game_state Black then "Black wins!"
             else if is_winner game_state White then "White wins!"
             else "Game in progress")
        ]
    ]

let () = Bonsai_web.Start.start app
