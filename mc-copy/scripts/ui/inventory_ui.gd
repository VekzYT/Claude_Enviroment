extends Control
## The backpack screen: 27 storage slots, the 9 hotbar slots, and a crafting
## list that turns raw blocks into building materials.
##
## Moving items uses the familiar "pick the stack up onto the cursor" model:
## left click picks up or drops a whole stack, right click splits or places one
## block, shift click shuttles a stack between the pack and the hotbar.

signal closed

## Recipes are plain data: cost is a list of [block id, amount].
## Filled in _ready() because block ids come from the BlockDB autoload, which is
## a runtime value rather than a compile-time constant.
var recipes: Array = []

func _make_recipes() -> Array:
	return [
		{"out": BlockDB.PLANKS, "count": 4, "cost": [[BlockDB.WOOD, 1]]},
		{"out": BlockDB.WORKBENCH, "count": 1, "cost": [[BlockDB.PLANKS, 4]]},
		{"out": BlockDB.GLASS, "count": 2, "cost": [[BlockDB.SAND, 2]]},
		{"out": BlockDB.BRICK, "count": 4, "cost": [[BlockDB.SAND, 2], [BlockDB.COBBLESTONE, 2]]},
		{"out": BlockDB.LAMP, "count": 1, "cost": [[BlockDB.COAL_ORE, 2], [BlockDB.PLANKS, 2]]},
		{"out": BlockDB.COBBLESTONE, "count": 1, "cost": [[BlockDB.GRAVEL, 4]]},
		{"out": BlockDB.SAND, "count": 2, "cost": [[BlockDB.GRAVEL, 1]]},
	]


var inventory: Inventory

var _slots: Array = []
var _cursor := {"id": 0, "count": 0}
var _cursor_panel: Panel
var _cursor_icon: TextureRect
var _cursor_label: Label
var _recipe_rows: Array = []


func _ready() -> void:
	recipes = _make_recipes()
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	visible = false
	_build()


func bind(p_inventory: Inventory) -> void:
	inventory = p_inventory
	inventory.changed.connect(refresh)
	refresh()


# ------------------------------------------------------------------ layout

func _build() -> void:
	var shade := ColorRect.new()
	shade.color = Color(0.03, 0.04, 0.06, 0.65)
	shade.set_anchors_preset(Control.PRESET_FULL_RECT)
	shade.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(shade)

	var centre := HBoxContainer.new()
	centre.set_anchors_and_offsets_preset(Control.PRESET_CENTER, Control.PRESET_MODE_MINSIZE)
	centre.grow_horizontal = Control.GROW_DIRECTION_BOTH
	centre.grow_vertical = Control.GROW_DIRECTION_BOTH
	centre.add_theme_constant_override("separation", 18)
	add_child(centre)

	centre.add_child(_build_pack_panel())
	centre.add_child(_build_crafting_panel())

	_build_cursor()


func _build_pack_panel() -> Control:
	var panel := PanelContainer.new()
	panel.add_theme_stylebox_override("panel", UITheme.panel(UITheme.BG_PANEL, UITheme.EDGE, 8, 2))

	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 10)
	panel.add_child(box)

	var title := UITheme.make_label("Pack", 22, UITheme.ACCENT)
	box.add_child(title)

	var grid := GridContainer.new()
	grid.columns = Inventory.COLUMNS
	grid.add_theme_constant_override("h_separation", 6)
	grid.add_theme_constant_override("v_separation", 6)
	box.add_child(grid)

	# Storage rows first (slot indices 9..35).
	for i in range(Inventory.HOTBAR_SIZE, Inventory.SIZE):
		var slot := SlotWidget.new(i, 52)
		slot.slot_clicked.connect(_on_slot_clicked)
		grid.add_child(slot)
		_slots.append(slot)

	var spacer := Control.new()
	spacer.custom_minimum_size = Vector2(0, 8)
	box.add_child(spacer)

	var bar_label := UITheme.make_label("Belt", 15, UITheme.TEXT_DIM)
	box.add_child(bar_label)

	var bar := GridContainer.new()
	bar.columns = Inventory.HOTBAR_SIZE
	bar.add_theme_constant_override("h_separation", 6)
	box.add_child(bar)
	for i in Inventory.HOTBAR_SIZE:
		var slot2 := SlotWidget.new(i, 52)
		slot2.slot_clicked.connect(_on_slot_clicked)
		bar.add_child(slot2)
		_slots.append(slot2)

	var help := UITheme.make_label(
		"Left click move stack  ·  right click split  ·  shift click send to belt", 13, UITheme.TEXT_DIM)
	box.add_child(help)
	return panel


func _build_crafting_panel() -> Control:
	var panel := PanelContainer.new()
	panel.add_theme_stylebox_override("panel", UITheme.panel(UITheme.BG_PANEL, UITheme.EDGE, 8, 2))

	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 8)
	panel.add_child(box)

	box.add_child(UITheme.make_label("Workbench", 22, UITheme.ACCENT))
	box.add_child(UITheme.make_label("Craft from what you are carrying.", 13, UITheme.TEXT_DIM))

	for recipe in recipes:
		var row := _build_recipe_row(recipe)
		box.add_child(row["node"])
		_recipe_rows.append(row)
	return panel


func _build_recipe_row(recipe: Dictionary) -> Dictionary:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 10)

	var icon := TextureRect.new()
	icon.texture = BlockDB.icon_of(recipe["out"])
	icon.custom_minimum_size = Vector2(34, 34)
	icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	icon.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	row.add_child(icon)

	var text := VBoxContainer.new()
	text.add_theme_constant_override("separation", 0)
	row.add_child(text)

	var name_label := UITheme.make_label("%d x %s" % [recipe["count"], BlockDB.get_name_of(recipe["out"])], 15)
	text.add_child(name_label)

	var parts: Array = []
	for cost in recipe["cost"]:
		parts.append("%d %s" % [cost[1], BlockDB.get_name_of(cost[0])])
	var cost_label := UITheme.make_label("needs " + ", ".join(parts), 12, UITheme.TEXT_DIM)
	text.add_child(cost_label)

	var spacer := Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(spacer)

	var button := Button.new()
	button.text = "Craft"
	UITheme.style_button(button, true)
	button.pressed.connect(_on_craft_pressed.bind(recipe))
	row.add_child(button)

	return {"node": row, "button": button, "recipe": recipe, "cost_label": cost_label}


func _build_cursor() -> void:
	_cursor_panel = Panel.new()
	_cursor_panel.add_theme_stylebox_override("panel", UITheme.slot_style(true))
	_cursor_panel.custom_minimum_size = Vector2(46, 46)
	_cursor_panel.size = Vector2(46, 46)
	_cursor_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_cursor_panel.visible = false
	_cursor_panel.z_index = 10
	add_child(_cursor_panel)

	_cursor_icon = TextureRect.new()
	_cursor_icon.set_anchors_preset(Control.PRESET_FULL_RECT)
	_cursor_icon.offset_left = 5
	_cursor_icon.offset_top = 5
	_cursor_icon.offset_right = -5
	_cursor_icon.offset_bottom = -5
	_cursor_icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_cursor_icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	_cursor_icon.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	_cursor_icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_cursor_panel.add_child(_cursor_icon)

	_cursor_label = UITheme.make_label("", 13)
	_cursor_label.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	_cursor_label.offset_left = -32
	_cursor_label.offset_top = -18
	_cursor_label.offset_right = -3
	_cursor_label.offset_bottom = -1
	_cursor_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_cursor_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_cursor_panel.add_child(_cursor_label)


# ------------------------------------------------------------------ update

func _process(_delta: float) -> void:
	if not visible:
		return
	if _cursor_panel.visible:
		_cursor_panel.position = get_global_mouse_position() - Vector2(23, 23)


func refresh() -> void:
	if inventory == null:
		return
	for slot in _slots:
		var s: SlotWidget = slot
		s.set_contents(inventory.slot_id(s.index), inventory.slot_count(s.index))
		s.set_selected(s.index == inventory.selected)
	_refresh_cursor()
	_refresh_recipes()


func _refresh_cursor() -> void:
	var has: bool = _cursor["count"] > 0 and _cursor["id"] > 0
	_cursor_panel.visible = has and visible
	if has:
		_cursor_icon.texture = BlockDB.icon_of(_cursor["id"])
		_cursor_label.text = str(_cursor["count"]) if _cursor["count"] > 1 else ""


func _refresh_recipes() -> void:
	for row in _recipe_rows:
		var recipe: Dictionary = row["recipe"]
		row["button"].disabled = not _can_craft(recipe)


func _can_craft(recipe: Dictionary) -> bool:
	if inventory == null:
		return false
	for cost in recipe["cost"]:
		if inventory.count_of(cost[0]) < cost[1]:
			return false
	return true


# ------------------------------------------------------------------ input

func open() -> void:
	visible = true
	refresh()


func close() -> void:
	_return_cursor_to_inventory()
	visible = false
	_cursor_panel.visible = false
	closed.emit()


func _return_cursor_to_inventory() -> void:
	if _cursor["count"] > 0 and _cursor["id"] > 0 and inventory != null:
		inventory.add(_cursor["id"], _cursor["count"])
	_cursor = {"id": 0, "count": 0}


func _on_slot_clicked(index: int, button: int, shift: bool) -> void:
	if inventory == null:
		return

	if shift and button == MOUSE_BUTTON_LEFT and _cursor["count"] == 0:
		inventory.quick_move(index)
		refresh()
		return


	if button == MOUSE_BUTTON_LEFT:
		_left_click(index)
	else:
		_right_click(index)
	inventory.notify_changed()


func _left_click(index: int) -> void:
	var slot_id := inventory.slot_id(index)
	var slot_count := inventory.slot_count(index)

	if _cursor["count"] == 0:
		if slot_count > 0:
			_cursor = {"id": slot_id, "count": slot_count}
			inventory.clear_slot(index)
		return

	if slot_count == 0:
		inventory.slots[index] = {"id": _cursor["id"], "count": _cursor["count"]}
		_cursor = {"id": 0, "count": 0}
		return

	if slot_id == _cursor["id"]:
		var space: int = Inventory.MAX_STACK - slot_count
		var moved: int = mini(space, _cursor["count"])
		inventory.slots[index]["count"] = slot_count + moved
		_cursor["count"] -= moved
		if _cursor["count"] <= 0:
			_cursor = {"id": 0, "count": 0}
		return

	# Different blocks: swap what is in hand with what is in the slot.
	var swapped := {"id": slot_id, "count": slot_count}
	inventory.slots[index] = {"id": _cursor["id"], "count": _cursor["count"]}
	_cursor = swapped


func _right_click(index: int) -> void:
	var slot_id := inventory.slot_id(index)
	var slot_count := inventory.slot_count(index)

	if _cursor["count"] == 0:
		if slot_count > 0:
			var half: int = maxi(1, slot_count / 2)
			_cursor = {"id": slot_id, "count": half}
			inventory.slots[index]["count"] = slot_count - half
			if inventory.slot_count(index) <= 0:
				inventory.clear_slot(index)
		return

	if slot_count == 0:
		inventory.slots[index] = {"id": _cursor["id"], "count": 1}
		_cursor["count"] -= 1
	elif slot_id == _cursor["id"] and slot_count < Inventory.MAX_STACK:
		inventory.slots[index]["count"] = slot_count + 1
		_cursor["count"] -= 1
	if _cursor["count"] <= 0:
		_cursor = {"id": 0, "count": 0}


func _on_craft_pressed(recipe: Dictionary) -> void:
	if not _can_craft(recipe):
		return
	for cost in recipe["cost"]:
		inventory.take(cost[0], cost[1])
	var leftover := inventory.add(recipe["out"], recipe["count"])
	if leftover > 0:
		# No room: put the ingredients back rather than losing them.
		inventory.take(recipe["out"], recipe["count"] - leftover)
		for cost in recipe["cost"]:
			inventory.add(cost[0], cost[1])
	inventory.notify_changed()


func _unhandled_input(event: InputEvent) -> void:
	if not visible:
		return
	if event.is_action_pressed("inventory") or event.is_action_pressed("pause"):
		close()
		get_viewport().set_input_as_handled()
