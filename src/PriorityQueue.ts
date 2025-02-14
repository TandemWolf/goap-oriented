/**
 * A priority queue implementation that maintains elements in a sorted order based on a comparison function.
 * @template T The type of elements stored in the queue
 */
export class PriorityQueue<T> {
  private items: T[];
  private compare: (a: T, b: T) => number;

  /**
   * Creates a new PriorityQueue instance.
   * @param compareFunction A function that defines the priority between two elements.
   * Should return a negative number if a has higher priority than b,
   * zero if they have equal priority, or a positive number if b has higher priority than a.
   */
  constructor(compareFunction: (a: T, b: T) => number) {
    this.items = [];
    this.compare = compareFunction;
  }

  /**
   * Adds an item to the queue and sorts it based on priority.
   * @param item The item to add to the queue
   */
  enqueue(item: T): void {
    this.items.push(item);
    this.items.sort(this.compare);
  }

  /**
   * Removes and returns the highest priority item from the queue.
   * @returns The highest priority item, or undefined if the queue is empty
   */
  dequeue(): T | undefined {
    return this.items.shift();
  }

  /**
   * Checks if the queue is empty.
   * @returns true if the queue contains no elements, false otherwise
   */
  isEmpty(): boolean {
    return this.items.length === 0;
  }
}
