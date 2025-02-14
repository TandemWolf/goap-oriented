import { PriorityQueue } from '../src/PriorityQueue';

describe('PriorityQueue', () => {
    test('should maintain priority order', () => {
        const queue = new PriorityQueue<number>((a, b) => a - b);

        queue.enqueue(3);
        queue.enqueue(1);
        queue.enqueue(4);
        queue.enqueue(2);

        expect(queue.dequeue()).toBe(1);
        expect(queue.dequeue()).toBe(2);
        expect(queue.dequeue()).toBe(3);
        expect(queue.dequeue()).toBe(4);
    });

    test('should handle empty queue', () => {
        const queue = new PriorityQueue<number>((a, b) => a - b);

        expect(queue.isEmpty()).toBe(true);
        expect(queue.dequeue()).toBeUndefined();
    });

    test('should handle objects with custom priority', () => {
        interface TestItem {
            value: string;
            priority: number;
        }

        const queue = new PriorityQueue<TestItem>((a, b) => a.priority - b.priority);

        queue.enqueue({ value: 'A', priority: 3 });
        queue.enqueue({ value: 'B', priority: 1 });
        queue.enqueue({ value: 'C', priority: 2 });

        expect(queue.dequeue()?.value).toBe('B');
        expect(queue.dequeue()?.value).toBe('C');
        expect(queue.dequeue()?.value).toBe('A');
    });
});