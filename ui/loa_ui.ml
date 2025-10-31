open! Core
open Virtual_dom
open! Bonsai.Let_syntax
open Loa_logic_library

(* Utilities to inspect board *)
let all_coords : coord list =
  List.init board_size ~f:(fun r -> List.init board_size ~f:(fun c -> { r; c }))
  |> List.concat

let get_cell (b:board) (p:coord) : cell option =
  List.nth b p.r |> Option.bind ~f:(fun row -> List.nth row p.c)

let is_piece (b:board) (p:player) (q:coord) : bool =
  match get_cell b q with Some (Piece x) when Poly.equal x p -> true | _ -> false

(* Generate all legal moves for the side to move, naive O(64*64) check *)
let all_legal_moves (st:state) : move_ list =
  let froms = List.filter all_coords ~f:(fun q -> is_piece st.board st.turn q) in
  List.concat_map froms ~f:(fun from_ ->
      List.filter_map all_coords ~f:(fun to_ ->
          if from_.r = to_.r && from_.c = to_.c then None
          else match legal_move st { from_; to_ } with Ok () -> Some { from_; to_ } | Error _ -> None))

type triplet = { s_from : state; mv : move_; s_to : state }

let build_triplets () : triplet list =
  let t1 =
    let s_from = Loa_logic_library.initial_state in
    let mv = Loa_logic_library.example_move1 in
    let s_to = match make_move s_from mv with Ok s -> s | Error _ -> failwith "illegal" in
    { s_from; mv; s_to }
  in
  let t2 =
    let s_from = (match make_move Loa_logic_library.initial_state Loa_logic_library.example_move1 with Ok s -> s | Error _ -> failwith "illegal") in
    let mv = Loa_logic_library.example_move2 in
    let s_to = match make_move s_from mv with Ok s -> s | Error _ -> failwith "illegal" in
    { s_from; mv; s_to }
  in
  (* Add 3 more deterministic triplets by taking the first few legal moves each step *)
  let rec extend acc st n =
    if n = 0 then List.rev acc
    else
      match all_legal_moves st with
      | [] -> List.rev acc
      | mv::_ ->
        let s_to = match make_move st mv with Ok s -> s | Error _ -> failwith "illegal" in
        extend ({ s_from = st; mv; s_to } :: acc) s_to (n-1)
  in
  let extra = extend [] t2.s_to 3 in
  t1 :: t2 :: extra

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

let board_view ~(state_to_show:state) ~(highlight:coord option * coord option) =
  let is_highlight r c =
    match highlight with
    | None, None -> false
    | Some a, Some b -> (a.r = r && a.c = c) || (b.r = r && b.c = c)
    | Some a, None -> a.r = r && a.c = c
    | None, Some b -> b.r = r && b.c = c
  in
  let render_cell r c =
    let piece =
      match get_cell state_to_show.board { r; c } with
      | Some (Piece Black) -> black_piece
      | Some (Piece White) -> white_piece
      | _ -> Vdom.Node.none
    in
    let border_classes =
      (if r < board_size - 1 then [ Vdom.Attr.class_ "border_bottom" ] else []) @
      (if c < board_size - 1 then [ Vdom.Attr.class_ "border_right" ] else [])
    in
    let highlight_class = if is_highlight r c then [ Vdom.Attr.class_ "slowly_appear" ] else [] in
    Vdom.Node.div
      ~attrs:
        ([ Vdom.Attr.class_ "column"
         ; Vdom.Attr.style Css_gen.(
             left (`Percent (Percent.of_percentage (Float.of_int c *. 12.5)))
             @> width (`Percent (Percent.of_percentage 12.5))
           )
         ] @ border_classes)
      [ Vdom.Node.div ~attrs:(highlight_class @ [ Vdom.Attr.class_ "max_size" ]) [ piece ] ]
  in
  Vdom.Node.div
    ~attrs:[ Vdom.Attr.class_ "game" ]
    (List.init board_size ~f:(fun r ->
         Vdom.Node.div
           ~attrs:
             [ Vdom.Attr.class_ "row"
             ; Vdom.Attr.style Css_gen.(
                 top (`Percent (Percent.of_percentage (Float.of_int r *. 12.5)))
                 @> height (`Percent (Percent.of_percentage 12.5))
               )
             ]
           (List.init board_size ~f:(fun c -> render_cell r c))))

let toolbar ~(triplet_idx:int) ~(num:int) ~(show_to:bool) ~set_idx ~set_show =
  let btn label on_click =
    Vdom.Node.button ~attrs:[ Vdom.Attr.on_click (fun _ -> on_click ()) ] [ Vdom.Node.text label ]
  in
  Vdom.Node.div
    ~attrs:[ Vdom.Attr.style (Css_gen.(margin (`Px 8))) ]
    [ btn "Prev" (fun () -> set_idx (Int.max 0 (triplet_idx - 1)))
    ; Vdom.Node.text (sprintf "  Triplet %d/%d  " (triplet_idx+1) num)
    ; btn "Next" (fun () -> set_idx (Int.min (num-1) (triplet_idx + 1)))
    ; Vdom.Node.text "  |  "
    ; btn (if show_to then "Show S_from" else "Show S_to") (fun () -> set_show (not show_to))
    ]

let app =
  let triplets = build_triplets () |> Array.of_list in
  let num = Array.length triplets in
  let%sub idx, set_idx = Bonsai.state (module Int) ~default_model:0 in
  let%sub show_to, set_show_to = Bonsai.state (module Bool) ~default_model:false in
  let%arr idx = idx
  and set_idx = set_idx
  and show_to = show_to
  and set_show_to = set_show_to in
  let idx = Int.clamp_exn idx ~min:0 ~max:(num-1) in
  let t = triplets.(idx) in
  let state_to_show = if show_to then t.s_to else t.s_from in
  Vdom.Node.div
    [ toolbar ~triplet_idx:idx ~num ~show_to ~set_idx ~set_show:set_show_to
    ; board_view ~state_to_show ~highlight:(Some t.mv.from_, Some t.mv.to_)
    ]

let () = Bonsai_web.Start.start app


