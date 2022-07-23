
// flag用二进制表示：可能有多个任务，1.组合具有唯一性 2.性能好

import reactDom from "./react-dom";

// ! flags
export const NoFlags = /*                      */ 0b00000000000000000000;
// 新增、插入、移动
export const Placement = /*                    */ 0b0000000000000000000010; // 2
// 节点更新属性
export const Update = /*                       */ 0b0000000000000000000100; // 4
// 删除
export const Deletion = /*                     */ 0b0000000000000000001000; // 8

//*******************************************************************************************

// 标记useEffect和useLayoutEffect
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
// 更新时不能简单的覆盖，因为有时候属性会变少，直接覆盖没办法删除去掉的属性
export function updateNode(node, prevValue, nextValue) {

  // 遍历老节点，清空一些属性
  Object.keys(prevValue).forEach((k) => {
    if(k === 'children') {
      // 老节点子节点是文本节点，直接去掉
      if(isStringOrNumber(nextValue[k])) {
        node.textContent = ""
      }
    } else if(k.slice(0, 2) === 'on') {
      // 老节点上的事件，去掉
      const eventName = k.slice(2).toLocaleLowerCase()
      node.removeEventListener(eventName, nextValue[k])
    } else {
      if( !(k in nextValue)) {
        // 如果老节点的属性，新节点上没有，就删除
        node[k] = ""
      }
    }
  })

  // 遍历新节点，初次渲染 、更新时覆盖属性
  Object.keys(nextValue).forEach((k) => {
    if(k === 'children') {
      // 单独处理子节点是文本节点的状况
      if(isStringOrNumber(nextValue[k])) {
        node.textContent = nextValue[k]
      }
    } else if(k.slice(0, 2) === 'on') {
      // 绑定事件
      const eventName = k.slice(2).toLocaleLowerCase()
      node.addEventListener(eventName, nextValue[k])
    } else {
      node[k] = nextValue[k]
    }
  })
}


// 比较hook的依赖项前后是不是一样，一样就不更新
export function areHookInputsEqual(nextDeps, prevDeps) {
  // 上次没有值，这次有值，肯定不一样
  if(prevDeps === null) {
    return false
  }

  // i < prevDeps.length && i < nextDeps.length 两个数组都不能越界
  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if(Object.is(prevDeps[i], nextDeps[i])) {
      continue
    }
    // 只要前后有一个依赖项不同，就更新
    return false
  }

  return true
}