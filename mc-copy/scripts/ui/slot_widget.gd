class_name SlotWidget
extends Panel
## One inventory square: background, block icon and stack count.

signal slot_clicked(index: int, button: int, shift: bool)

const SIZE := 52

var index: int = 0
var block_id: int = 0
var count: int = 0
var selected: bool = false

var _icon: TextureRect
var _count_label: Label
var _hovered := false


func _init(p_index: int = 0, p_size: int = SIZE) -> void:
	index = p_index
	custom_minimum_size = Vector2(p_size, p_size)
	mouse_filter = Control.MOUSE_FILTER_STOP

	_icon = TextureRect.new()
	_icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	_icon.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	_icon.set_anchors_preset(Control.PRESET_FULL_RECT)
	_icon.offset_left = 6
	_icon.offset_top = 6
	_icon.offset_right = -6
	_icon.offset_bottom = -6
	_icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_icon)

	_count_label = UITheme.make_label("", 13)
	_count_label.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	_count_label.offset_left = -34
	_count_label.offset_top = -20
	_count_label.offset_right = -4
	_count_label.offset_bottom = -2
	_count_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_count_label.vertical_alignment = VERTICAL_ALIGNMENT_BOTTOM
	_count_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_count_label)


func _ready() -> void:
	mouse_entered.connect(func() -> void:
		_hovered = true
		_refresh_style())
	mouse_exited.connect(func() -> void:
		_hovered = false
		_refresh_style())
	_refresh_style()


func set_contents(p_id: int, p_count: int) -> void:
	block_id = p_id
	count = p_count
	_icon.texture = BlockDB.icon_of(p_id) if p_id > 0 else null
	_count_label.text = str(p_count) if p_count > 1 else ""
	_icon.visible = p_id > 0


func set_selected(value: bool) -> void:
	if selected == value:
		return
	selected = value
	_refresh_style()


func _refresh_style() -> void:
	add_theme_stylebox_override("panel", UITheme.slot_style(selected, _hovered))


func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_LEFT or event.button_index == MOUSE_BUTTON_RIGHT:
			slot_clicked.emit(index, event.button_index, event.shift_pressed)
			accept_event()


func tooltip_text_for() -> String:
	if block_id <= 0:
		return ""
	return BlockDB.get_name_of(block_id)
