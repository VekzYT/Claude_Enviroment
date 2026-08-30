class_name Hotbar
extends HBoxContainer
## The nine quick-access slots along the bottom of the screen.

signal slot_picked(index: int)

var inventory: Inventory
var _slots: Array = []


func _ready() -> void:
	add_theme_constant_override("separation", 6)
	mouse_filter = Control.MOUSE_FILTER_PASS
	for i in Inventory.HOTBAR_SIZE:
		var slot := SlotWidget.new(i, 54)
		slot.slot_clicked.connect(_on_slot_clicked)
		add_child(slot)
		_slots.append(slot)


func bind(p_inventory: Inventory) -> void:
	inventory = p_inventory
	inventory.changed.connect(refresh)
	inventory.selection_changed.connect(func(_i: int) -> void: refresh())
	refresh()


func refresh() -> void:
	if inventory == null:
		return
	for i in _slots.size():
		var slot: SlotWidget = _slots[i]
		slot.set_contents(inventory.slot_id(i), inventory.slot_count(i))
		slot.set_selected(i == inventory.selected)


func _on_slot_clicked(index: int, _button: int, _shift: bool) -> void:
	if inventory != null:
		inventory.select(index)
	slot_picked.emit(index)
