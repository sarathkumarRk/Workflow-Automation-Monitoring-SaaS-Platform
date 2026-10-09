def evaluate_condition(
    input_data: dict,
    field: str,
    operator: str,
    expected_value,
) -> bool:

    actual_value = input_data.get(field)

    if actual_value is None:
        return False

    if operator == "equals":
        return actual_value == expected_value

    elif operator == "not_equals":
        return actual_value != expected_value

    elif operator == "greater_than":
        try:
            return float(actual_value) > float(expected_value)
        except (TypeError, ValueError):
            return False

    elif operator == "less_than":
        try:
            return float(actual_value) < float(expected_value)
        except (TypeError, ValueError):
            return False

    elif operator == "contains":
        return str(expected_value) in str(actual_value)

    else:
        raise ValueError(f"Unsupported operator: {operator}")