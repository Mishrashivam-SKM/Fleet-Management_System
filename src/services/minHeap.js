/**
 * @file Implements a Min-Heap class.
 * This data structure acts as a Priority Queue, which is essential for
 * efficiently sorting tasks based on their deadlines (`timeWindowEnd`).
 * The task with the earliest deadline will always be at the root of the heap,
 * allowing for very fast extraction of the most urgent task.
 */

export class MinHeap {
    /**
     * Initializes the heap as an empty array.
     * The first element of a task object to be compared must be its priority value.
     * For this project, we prioritize based on the `timeWindowEnd` timestamp.
     */
    constructor() {
        this.heap = [];
    }

    /**
     * Inserts a new task into the heap, maintaining the heap property.
     * Time Complexity: O(log n)
     * @param {object} task - The task object to insert. Must have a `timeWindowEnd` property.
     */
    insert(task) {
        this.heap.push(task);
        this.bubbleUp(this.heap.length - 1);
    }

    /**
     * Removes and returns the task with the smallest `timeWindowEnd` (highest priority).
     * Time Complexity: O(log n)
     * @returns {object|null} The task with the highest priority or null if the heap is empty.
     */
    extractMin() {
        if (this.heap.length === 0) {
            return null;
        }
        if (this.heap.length === 1) {
            return this.heap.pop();
        }

        const min = this.heap[0];
        this.heap[0] = this.heap.pop(); // Move last element to the root
        this.bubbleDown(0);
        return min;
    }

    /**
     * Moves an element up the heap to its correct position.
     * @private
     * @param {number} index - The index of the element to bubble up.
     */
    bubbleUp(index) {
        while (index > 0) {
            let parentIndex = Math.floor((index - 1) / 2);

            // Compare timeWindowEnd timestamps (seconds property)
            if (this.heap[parentIndex].timeWindowEnd.seconds > this.heap[index].timeWindowEnd.seconds) {
                this.swap(parentIndex, index);
                index = parentIndex;
            } else {
                break;
            }
        }
    }

    /**
     * Moves an element down the heap to its correct position.
     * @private
     * @param {number} index - The index of the element to bubble down.
     */
    bubbleDown(index) {
        const lastIndex = this.heap.length - 1;
        while (true) {
            let leftChildIndex = 2 * index + 1;
            let rightChildIndex = 2 * index + 2;
            let smallestChildIndex = index;

            if (leftChildIndex <= lastIndex && this.heap[leftChildIndex].timeWindowEnd.seconds < this.heap[smallestChildIndex].timeWindowEnd.seconds) {
                smallestChildIndex = leftChildIndex;
            }

            if (rightChildIndex <= lastIndex && this.heap[rightChildIndex].timeWindowEnd.seconds < this.heap[smallestChildIndex].timeWindowEnd.seconds) {
                smallestChildIndex = rightChildIndex;
            }

            if (smallestChildIndex !== index) {
                this.swap(index, smallestChildIndex);
                index = smallestChildIndex;
            } else {
                break;
            }
        }
    }

    /**
     * Swaps two elements in the heap.
     * @private
     * @param {number} i - Index of the first element.
     * @param {number} j - Index of the second element.
     */
    swap(i, j) {
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    }

    /**
     * Checks if the heap is empty.
     * @returns {boolean}
     */
    isEmpty() {
        return this.heap.length === 0;
    }
}

