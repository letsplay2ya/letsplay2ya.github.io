"""Tested with Python 3.12 / NumPy 2.3.5."""
import numpy as np
original = np.array([10, 20, 30, 40])
view = original[1:3]
view[0] = 99
assert original.tolist() == [10, 99, 30, 40]
assert np.shares_memory(original, view)
copied = original[1:3].copy()
copied[0] = -1
assert original.tolist() == [10, 99, 30, 40]
assert not np.shares_memory(original, copied)
selected = original[[1, 2]]
selected[0] = 777
assert original[1] == 99
original[[1, 2]] = 0
assert original.tolist() == [10, 0, 0, 40]
print("NumPy", np.__version__, "view/copy/indexed-assignment checks passed.")
