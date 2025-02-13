import { Goal } from "../src/types";

import { Agent } from "../src/Agent";
import { Action, WorldState } from "../src/types";
import { GOAPPlanner } from "../src/Planner";

describe('GOAP Edge Cases', () => {
    test('should handle circular dependencies', () => {
        const planner = new GOAPPlanner();

        const actions: Action[] = [
            {
                name: 'ActionA',
                cost: 1,
                preconditions: [{ key: 'stateB', value: true }],
                effects: [{ key: 'stateA', value: true }]
            },
            {
                name: 'ActionB',
                cost: 1,
                preconditions: [{ key: 'stateA', value: true }],
                effects: [{ key: 'stateB', value: true }]
            }
        ];

        actions.forEach(action => planner.addAction(action));

        const initialState: WorldState = {
            stateA: false,
            stateB: false
        };

        const goal: Goal = {
            name: 'CircularGoal',
            conditions: [
                { key: 'stateA', value: true },
                { key: 'stateB', value: true }
            ]
        };

        const plan = planner.findPlan(initialState, goal);
        expect(plan.length).toBe(0); // Should detect impossible circular dependency
    });

    test('should handle dynamic cost functions', () => {
        const planner = new GOAPPlanner();

        const action: Action = {
            name: 'DynamicCostAction',
            cost: (state: WorldState) => state.energy > 50 ? 1 : 3,
            preconditions: [],
            effects: [{ key: 'goal', value: true }]
        };

        planner.addAction(action);

        const highEnergyState: WorldState = { energy: 100 };
        const lowEnergyState: WorldState = { energy: 20 };

        const goal: Goal = {
            name: 'DynamicCostGoal',
            conditions: [{ key: 'goal', value: true }]
        };

        const highEnergyPlan = planner.findPlan(highEnergyState, goal);
        const lowEnergyPlan = planner.findPlan(lowEnergyState, goal);

        const highEnergyCost = typeof highEnergyPlan[0].cost === 'function'
            ? highEnergyPlan[0].cost(highEnergyState)
            : highEnergyPlan[0].cost;

        const lowEnergyCost = typeof lowEnergyPlan[0].cost === 'function'
            ? lowEnergyPlan[0].cost(lowEnergyState)
            : lowEnergyPlan[0].cost;

        expect(highEnergyCost).toBeLessThan(lowEnergyCost);
    });

    test('should handle state rollbacks on failed actions', async () => {
        const agent = new Agent({
            resource: 10,
            crafted: false
        });

        const action: Action = {
            name: 'FailingCraft',
            cost: 1,
            preconditions: [{ key: 'resource', value: 5, operator: 'greaterThan' }],
            effects: [
                { key: 'resource', value: (state: WorldState) => state.resource - 5 },
                { key: 'crafted', value: true }
            ],
            execute: async () => {
                throw new Error('Craft failed');
            }
        };

        agent.addAction(action);

        const goal: Goal = {
            name: 'CraftGoal',
            conditions: [{ key: 'crafted', value: true }]
        };

        await agent.executePlan(goal);
        const finalState = agent.getCurrentState();

        // Resource should not be consumed if action failed
        expect(finalState.resource).toBe(10);
        expect(finalState.crafted).toBe(false);
    });
});