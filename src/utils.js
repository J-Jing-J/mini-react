
// flag用二进制表示：可能有多个任务，1.组合具有唯一性 2.性能好

// ! flags
export const NoFlags = /*                      */ 0b00000000000000000000;
// 新增、插入、移动
export const Placement = /*                    */ 0b0000000000000000000010; // 2
// 节点更新属性
export const Update = /*                       */ 0b0000000000000000000100; // 4
// 删除
export const Deletion = /*                     */ 0b0000000000000000001000; // 8

//*******************************************************************************************

// ! HookFlags
export const HookLayout = /*    */ 0b010;
export const HookPassive = /*   */ 0b100;

//*******************************************************************************************

export function isStr(s) {
  return typeof s === "string";
}

export function isStringOrNumber(s) {
  return typeof s === "string" || typeof s === "number";
}

export function isFn(fn) {
  return typeof fn === "function";
}

export function isArray(arr) {
  return Array.isArray(arr);
}

export function isUndefined(s) {
  return s === undefined;
}

// 把属性更新到节点上
export function updateNode(node, nextValue) {
  Object.keys(nextValue).forEach((k) => {
    if(k === 'children') {
      if(isStringOrNumber(nextValue[k])) {
        node.textContent = nextValue[k]
      }
    } else {
      node[k] = nextValue[k]
    }
  })
}