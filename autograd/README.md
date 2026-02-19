# Project 12: Autograd Engine

## Level 1: Value Class + Basic Operations

**Implement a scalar autograd engine (inspired by Karpathy's micrograd):**

```
class Value:
    __init__(data: float, label: str = "")
    data: float
    grad: float          # gradient, initialized to 0.0
    __add__(other) -> Value
    __mul__(other) -> Value
    __neg__() -> Value
    __sub__(other) -> Value
```

**Requirements:**
- Every `Value` stores `data` (the number) and `grad` (the gradient)
- Operations return new `Value` objects that track their parents (children)
- Support `Value + Value`, `Value * Value`, `Value - Value`, `Value + float`, etc.
- Each operation records a `_backward` function that computes local gradients
- No gradient computation yet — just build the expression graph

**Test Cases:**
```python
a = Value(2.0)
b = Value(3.0)
c = a + b
assert c.data == 5.0

d = a * b
assert d.data == 6.0

e = a + 1.0
assert e.data == 3.0

f = -a
assert f.data == -2.0
```

---

## Level 2: Backpropagation

**Add backward pass:**

```
class Value:
    backward() -> None   # compute gradients for all nodes in graph
    __pow__(n) -> Value   # power operation
    relu() -> Value       # ReLU activation
    tanh() -> Value       # tanh activation
```

**Requirements:**
- `backward()` computes gradients via reverse-mode autodiff (chain rule)
- Topological sort the expression graph, then apply `_backward` in reverse order
- The root node's gradient is set to 1.0 before backprop
- Handle nodes used in multiple expressions (gradients accumulate with `+=`)
- Implement `__pow__`, `relu()`, and `tanh()` with correct local gradients

**Gradient rules:**
```
Addition:  d/da (a + b) = 1.0,  d/db (a + b) = 1.0
Multiply:  d/da (a * b) = b,    d/db (a * b) = a
Power:     d/da (a ** n) = n * a^(n-1)
ReLU:      d/da relu(a) = 1.0 if a > 0 else 0.0
tanh:      d/da tanh(a) = 1 - tanh(a)^2
```

**Test Cases:**
```python
a = Value(2.0)
b = Value(3.0)
c = a * b       # 6.0
d = c + a       # 8.0 (a is used twice!)
d.backward()

assert a.grad == 4.0   # d/da = b + 1 = 3 + 1 = 4 (chain rule, a used twice)
assert b.grad == 2.0   # d/db = a = 2

# Verify against PyTorch (if available)
```

---

## Level 3: Neuron + MLP

**Build a neural network from Value objects:**

```
class Neuron:
    __init__(n_inputs: int, activation: str = "relu")
    __call__(x: list[Value]) -> Value

class Layer:
    __init__(n_inputs: int, n_outputs: int, activation: str = "relu")
    __call__(x: list[Value]) -> list[Value]

class MLP:
    __init__(n_inputs: int, layer_sizes: list[int])
    __call__(x: list[Value]) -> list[Value]
    parameters() -> list[Value]
```

**Requirements:**
- `Neuron`: stores weights + bias as `Value` objects, computes `activation(sum(w*x) + b)`
- `Layer`: list of neurons, applies each to the same input
- `MLP`: chain of layers, output of one feeds into next
- Last layer has no activation (linear output)
- `parameters()` returns flat list of all `Value` weights and biases
- Initialize weights randomly (small values, e.g., uniform(-1, 1))

**Test Cases:**
```python
model = MLP(3, [4, 4, 1])  # 3 inputs, two hidden layers of 4, 1 output
x = [Value(1.0), Value(2.0), Value(3.0)]
out = model(x)
assert len(out) == 1
assert isinstance(out[0], Value)

params = model.parameters()
assert len(params) == (3*4 + 4) + (4*4 + 4) + (4*1 + 1)  # weights + biases
```

---

## Level 4: Training Loop

**Train the MLP on a simple dataset:**

```
class SGD:
    __init__(parameters: list[Value], lr: float = 0.01)
    step() -> None       # update parameters: p.data -= lr * p.grad
    zero_grad() -> None  # reset all gradients to 0
```

**Requirements:**
- Implement mean squared error loss: `sum((pred - target)^2) / n`
- Training loop: forward pass -> compute loss -> backward -> update -> zero grad
- Train on a simple binary classification (e.g., XOR-like data)
- Loss should decrease over iterations
- Print loss every N steps to show convergence

**Test Cases:**
```python
# Simple dataset: learn to predict y = 1 if sum(x) > 0 else -1
xs = [[2.0, 3.0], [-1.0, -2.0], [1.0, -1.0], [-2.0, 1.0]]
ys = [1.0, -1.0, 1.0, -1.0]

model = MLP(2, [4, 4, 1])
optimizer = SGD(model.parameters(), lr=0.05)

# Train for 100 steps
initial_loss = None
final_loss = None
for step in range(100):
    # forward
    preds = [model([Value(x[0]), Value(x[1])])[0] for x in xs]
    loss = sum((p - Value(y)) ** 2 for p, y in zip(preds, ys))

    if step == 0:
        initial_loss = loss.data
    if step == 99:
        final_loss = loss.data

    # backward
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()

assert final_loss < initial_loss  # loss decreased
```
