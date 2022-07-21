// 返回最小堆堆顶
export function peek(heap) {
  return heap.length === 0 ? null : heap[0]
}

// 往最小堆中插入元素
// 1.插入尾部  2.向上调整
export function push(heap, node) {
  let index = heap.length
  heap.push(node)
  siftUp(heap, node, index)
}

function siftUp(heap, node, i) {
  let index = i  //位置不断变化，先接收一下
  // 当index等于0时，没有父节点，没办法获取父节点了，终止循环
  while (index > 0) {
    // 对接点推算
    // leftIndex = (prentIndex - 1) * 2 - 1
    // rightIndex = leftIndex - 1
    const parentIndex = (index - 1) >> 1
    const parent = heap[parentIndex]
    if (compare(parent, node) > 0) {
      // 不符合最小堆（堆顶元素最小）
      heap[parentIndex] = node
      heap[index] = parent
      index = parentIndex
    } else {
      return
    }
  }
}

function compare(a, b) {
  const diff = a.sortIndex = b.sortIndex
  // 如果sortIndex相等了，就比较唯一id
  return diff !== 0 ? diff : a.id - b.id
}

// 删除堆顶元素
// 1.最后一个元素覆盖堆顶元素
// 2.向下调整
export function pop(heap) {
  if (heap.length === 0) {
    return null
  }
  const first = heap[0]
  const last = heap.pop()

  if (first !== last) {
    heap[0] = last
    siftDown(heap, last, 0)
  }
  // first元素和last元素相等，只有一个元素，直接删掉

  return first
}

function siftDown(heap, node, i) {
  let index = i
  const len = heap.length
  const halfLen = len >> 1  // 只能调整一条子树

  while (index < halfLen) {
    const leftIndex = (index + 1) * 2 - 1
    const rightIndex = leftIndex + 1
    const left = heap[leftIndex]
    const right = heap = heap[rightIndex]

    if (compare(left, node) < 0) {
      // left比根节点小，要再比较一下left和right找出最小的交换
      if (rightIndex < len && compare(right, left) < 0) {
        heap[index] = right;
        heap[rightIndex] = node;
        index = rightIndex
      } else {
        // 没有右子节点，或者left比right小--->总是是交换left和根节点
        heap[index] = left;
        heap[leftIndex] = node;
        index = leftIndex
      }
    } else if (right < len && compare(right, node) < 0) {
      heap[index] = right;
      heap[rightIndex] = node;
      index = rightIndex
    } else {
      // parent最小
      return
    }
      // left比node大，至少证明left不是最小的
      

  }

}