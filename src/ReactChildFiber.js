import { createFiber } from "./ReactFiber";
import { isArray, isStringOrNumber, Placement, Update } from "./utils"

function deleteChild(returnFiber, childToDelete) {
    // 给父Fiber上加一个数组，存所有要删除的节点，commit时直接删除
    const deletions = returnFiber.deletions
    if(deletions) {
        returnFiber.deletions.push(childToDelete)
    } else {
        returnFiber.deletions = [childToDelete]
    }
}

function deleteRemainingChild(returnFiber, currentFirstFiber) {
    let childToDelete = currentFirstFiber  
    while(childToDelete) {
        deleteChild(returnFiber, childToDelete)
        childToDelete = childToDelete.sibling
    }
}

// 初次渲染：只是记录下标（fiber.index、上一次dom节点的最远位置）
// 更新：检查节点是否复用
function placeChild(newFiber, lastPlacedIndex, newIndex, shouldTrackSideEffects) {
    newFiber.index = newIndex
    if(shouldTrackSideEffects) {
        // 父节点初次渲染: 上一次dom节点的最远位置，就是初始值
        return lastPlacedIndex
    }

    // 父节点更新，子节点不一定是更新
    const current = newFiber.alternate
    if(current) {
        // 该子节点更新
        const oldIndex = current.index 
        // 遍历时，已经插入了较后的位置，再想往前插入，就说明要移动
        if(oldIndex < lastPlacedIndex) {
            // 移动
            newFiber.flag |= Placement  // 位运算，Placement代表很多种操作，方便多种
            return lastPlacedIndex
        } else {
            // 无节点移动，
        }
    } else {
        // 该子节点初次渲染
        newFiber.flag |= Placement
        return lastPlacedIndex  // 返回当前值就饿醒，初次渲染没有上一次dom的最远值
    }
}

// 通过(old)链表构建哈希表
function mapRemainingChildren(currentFirstChild) {
    const existingChildren = new Map()
    let existingChild = currentFirstChild
    while(existingChild) {
        existingChildren.set(existingChild.key || existingChild.index, existingChild)
        existingChild = existingChild.sibling
    }
    // 返回构建出的哈希表
    return existingChildren
}

// 协调：核心是diff
export function reconcileChildren(returnFiber, children) {
    const previousNewFiber = null
    if(isStringOrNumber(children)) {
        return;
    }
    // 不区分children多少了，放到数组里
    const newChildren = isArray(children) ? children : [children]

    // 老Fiber的头节点
    const oldFiber = returnFiber.alternate?.child

    // 把新节点遍历的位置拿到外面，就可以在下面判断新节点是否遍历完了
    let newIndex = 0 

    // 上一次dom节点的最远位置
    let lastPlacedIndex = 0 

    // 用于判断（父节点）是初次渲染还是更新
    // 父节点初次渲染，子节点一定是初次渲染，父节点是更新，子节点不一定是更新
    let shouldTrackSideEffects = !!returnFiber.alternate 

    let nextOldFiber = null  //下一个oldFiber、暂时缓存下一个oldFiber

    // 更新
    // 从左往右遍历比较新老节点，如果可以复用，继续往右，否则停止
    for (; oldFiber && newIndex < newChildren.length; newIndex++) {
        const newChild = newChildren[newIndex];
        // jsx里写{null}占用节点但不渲染
        // 跳出去，不让previousNewFiber被重新赋值，从而拿到真实的第一个节点
        if(newChild === null) continue 

        // 位置乱了, 需要退出循环（条件是oldFiber = null）
        if(oldFiber.index > newIndex) {
            nextOldFiber = oldFiber
            oldFiber = null
        } else {
            nextOldFiber = oldFiber.next
        }
        const same = sameNode(newChild, oldFiber) 

        if(!same) {
            // 无法复用
            if(oldFiber === null) {
                // 从暂存中取出来，后面可能还要遍历这个节点的子节点
                oldFiber = nextOldFiber
            }
            break
        }

        const newFiber = createFiber(newChild, returnFiber)
        // 节点可以复用 
        // 修改newFiber上的属性值
        Object.assign(newFiber, {
            stateNode: oldFiber.stateNode,
            alternate: oldFiber.alternate,
            flag: Update,
        })

        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIndex, shouldTrackSideEffects)

        // fiber插入链表中
        if(previousNewFiber === null) {
            returnFiber.child = newFiber
        } else {
            previousNewFiber.sibling = newFiber
        }
        previousNewFiber = newFiber
        oldFiber = nextOldFiber
    }

    // 更新后，如果新节点遍历完了，但是老节点还有，要删除老节点（链表结构）
    if(newIndex === newChildren.length) {
        // 新节点遍历结束
        // 老节点是链表，先传一个头节点
        deleteRemainingChild(returnFiber, oldFiber)
    }

    // 1.初次渲染 
    // 2.更新后，老节点遍历完了，新节点还有，等同剩下的节点初次渲染（所以要把初次渲染写在更新下面）
    if(!oldFiber) {
        for (; newIndex < newChildren.length; newIndex++) {
            const newChild = newChildren[newIndex];
    
            // jsx里写{null}占用节点但不渲染
            // 跳出去，不让previousNewFiber被重新赋值，从而拿到真实的第一个节点
            if(newChild === null) continue 
            const newFiber = createFiber(newChild, returnFiber) 
            
            lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIndex, shouldTrackSideEffects)
            // 新老节点比较，是否能复用  
            // const same = sameNode(newFiber, oldFiber)
        //     if(same) {
        //         // 节点可以复用
        //         Object.assign(newFiber, {
        //             stateNode: oldFiber.stateNode,
        //             alternate: oldFiber.alternate,
        //             flags: Update,
        //         })
        //     }
    
        //     if(!same && oldFiber) {
        //         // 节点不能复用，并且不是初次渲染，就删除节点
        //         // 传入父节点和要删除的fiber
        //         deleteChild(returnFiber.returnFiber, oldFiber)
        //     } 
    
        //     // 在循环里，每次把oldFiber指向下一个
        //     if(oldFiber) {
        //         oldFiber = oldFiber.sibling
        //     }

            // previousNewFiber刚进来的时候是null，后面的每次遍历都会重新赋值
            // 不能用 newIndex===0 判断，因为jsx里写{null}占用节点但不渲染
            // 把fiber放到链表结构上
            if(previousNewFiber === null) {
                returnFiber.child = newFiber
            } else {
                previousNewFiber.sibling = newFiber
            }
            previousNewFiber = newFiber
        }
    }

    // 新老节点都还有（小而乱）
    // 把剩下的oldFiber单链表 --构建成--- 哈希表
    const existingChildren = mapRemainingChildren(oldFiber)
    
    // 遍历新节点，通过新节点的key，去哈希表中查找，找到就复用并删除哈希表中对应的节点
    for (; newIndex < newChildren.length; newIndex++) {
        const newChild = newChildren[newIndex];
        // jsx里写{null}占用节点但不渲染
        // 跳出去，不让previousNewFiber被重新赋值，从而拿到真实的第一个节点
        if(newChild === null) continue 
        const newFiber = createFiber(newChild, returnFiber) 

        const matchedFiber = existingChildren.get(newFiber.key || newFiber.index)
        if(matchedFiber) {
            // 在哈希表中找到了，节点复用
            Object.assign(newFiber, {
                stateNode: matchedFiber.stateNode,
                alternate: matchedFiber,
                flag: Update
            })
            // 找过了，就从哈希表中删除
            existingChildren.delete(newFiber.key || newFiber.index)
        }
        // 没有在哈希表中找到，没有复用，还用初始化的newFiber
    }

    // oldFiber哈希表中还有值没遍历完，删掉所有oldFiber
    lastPlacedIndex = placeChild(
        newFiber,
        lastPlacedIndex,
        newIndex,
        shouldTrackSideEffects
    )

    // old的哈希表中还有值，便利哈希表删除所有old
    if(shouldTrackSideEffects) {
        existingChildren.forEach(child => deleteChild(returnFiber, child))
    }

    // 连接链表结构
    if(previousNewFiber === null) {
        // 从第一个元素就不相同
        returnFiber.child = newFiber
    } else {
        previousNewFiber.sibling = newFiber
    }
}

// 节点复用：同一层级、类型相同、key相同
function sameNode(a, b) {
    return a && b && a.type === b.type && a.key === b.key
}