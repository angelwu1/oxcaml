open! Core
open Loa_logic_library
open Hw4_alpha_beta_search
open Virtual_dom
open! Bonsai.Let_syntax

(* Board inspection helpers *)
let get_cell (b:board) (p:coord) : cell option =
  List.nth b p.r |> Option.bind ~f:(fun row -> List.nth row p.c)

(* Game mode *)
type game_mode = PassAndPlay | VsComputer
type selected_cell = coord option

type game_ui_state = {
  game_state : state;
  selected : selected_cell;
  mode : game_mode;
}

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

(* Render LOA board with click handlers *)
let loa_board ~(ui_state : game_ui_state) ~set_ui_state =
  let game_state = ui_state.game_state in
  let selected = ui_state.selected in
  let is_game_over = is_winner game_state Black || is_winner game_state White in
  
  let render_cell ~row ~col =
    let cell_coord = { r = row; c = col } in
    let cell_value = get_cell game_state.board cell_coord in
    let is_selected = match selected with Some s -> s.r = row && s.c = col | None -> false in
    
    let piece_svg =
      match cell_value with
      | Some (Piece Black) -> black_piece
      | Some (Piece White) -> white_piece
      | _ -> Vdom.Node.none
    in
    
    let click_handler =
      if is_game_over then Vdom.Attr.empty
      else
        Vdom.Attr.on_click (fun _ ->
          match selected with
          | None ->
            (* No piece selected: try to select this piece if it's ours *)
            (match cell_value with
             | Some (Piece p) when Poly.equal p game_state.turn ->
               set_ui_state { ui_state with selected = Some cell_coord }
             | _ -> Vdom.Effect.Ignore)
          | Some from_coord ->
            (* Piece already selected: try to move *)
            if from_coord.r = row && from_coord.c = col then
              (* Clicked same piece: deselect *)
              set_ui_state { ui_state with selected = None }
            else
              let move = { from_ = from_coord; to_ = cell_coord } in
              match make_move game_state move with
              | Error _ -> 
                (* Illegal move: deselect *)
                set_ui_state { ui_state with selected = None }
              | Ok new_state ->
                (* Legal move: update state and handle computer turn *)
                if Poly.equal ui_state.mode VsComputer && Poly.equal new_state.turn White then
                  (* Computer's turn *)
                  match random_move new_state with
                  | None -> set_ui_state { ui_state with game_state = new_state; selected = None }
                  | Some comp_move ->
                    (match make_move new_state comp_move with
                     | Ok comp_state -> set_ui_state { ui_state with game_state = comp_state; selected = None }
                     | Error _ -> set_ui_state { ui_state with game_state = new_state; selected = None })
                else
                  set_ui_state { ui_state with game_state = new_state; selected = None }
        )
    in
    
    let highlight_class = if is_selected then [ Vdom.Attr.class_ "slowly_appear" ] else [] in
    let clickable_class = if not is_game_over then [ Vdom.Attr.class_ "box-shadow-with-hover-effect" ] else [] in
    
    let attrs =
      [ Vdom.Attr.class_ "column"
      ; Vdom.Attr.style
          Css_gen.(
            left (`Percent (Percent.of_percentage (Float.of_int col *. 12.5)))
            @> width (`Percent (Percent.of_percentage 12.5))
          )
      ; click_handler
      ]
      @ (if row < board_size - 1 then [ Vdom.Attr.class_ "border_bottom" ] else [])
      @ (if col < board_size - 1 then [ Vdom.Attr.class_ "border_right" ] else [])
    in
    
    Vdom.Node.div
      ~attrs
      [ Vdom.Node.div ~attrs:(highlight_class @ clickable_class @ [ Vdom.Attr.class_ "max_size" ]) [ piece_svg ] ]
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
  let initial_ui_state = {
    game_state = initial_state;
    selected = None;
    mode = PassAndPlay;
  } in
  
  let%sub ui_state, set_ui_state =
    Bonsai.state (module struct
      type t = game_ui_state
      let sexp_of_t _ = Sexp.Atom "ui_state"
      let t_of_sexp _ = initial_ui_state
      let equal a b = Poly.equal a.game_state b.game_state && Poly.equal a.selected b.selected
    end) ~default_model:initial_ui_state
  in
  
  let%arr ui_state = ui_state
  and set_ui_state = set_ui_state in
  
  let game_state = ui_state.game_state in
  let mode_str = match ui_state.mode with PassAndPlay -> "Pass & Play" | VsComputer -> "vs Computer" in
  
  Vdom.Node.div
    [ Vdom.Node.div
        [ Vdom.Node.text (sprintf "Lines of Action | Mode: %s" mode_str) ]
    ; Vdom.Node.div
        [ Vdom.Node.button
            ~attrs:[ Vdom.Attr.on_click (fun _ -> 
              set_ui_state { mode = PassAndPlay; game_state = initial_state; selected = None }) ]
            [ Vdom.Node.text "Pass & Play" ]
        ; Vdom.Node.button
            ~attrs:[ Vdom.Attr.on_click (fun _ -> 
              set_ui_state { mode = VsComputer; game_state = initial_state; selected = None }) ]
            [ Vdom.Node.text "vs Computer" ]
        ; Vdom.Node.button
            ~attrs:[ Vdom.Attr.on_click (fun _ -> 
              set_ui_state { ui_state with game_state = initial_state; selected = None }) ]
            [ Vdom.Node.text "New Game" ]
        ]
    ; Vdom.Node.div
        [ Vdom.Node.text
            (sprintf "Turn: %s"
               (match game_state.turn with Black -> "Black" | White -> "White"))
        ]
    ; loa_board ~ui_state ~set_ui_state
    ; Vdom.Node.div
        [ Vdom.Node.text
            (if is_winner game_state Black then "🏆 Black wins!"
             else if is_winner game_state White then "🏆 White wins!"
             else match ui_state.selected with
                  | None -> "Click a piece to select"
                  | Some _ -> "Click destination to move")
        ]
    ]

let () = Bonsai_web.Start.start app
