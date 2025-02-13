import { WorldState, Action, Goal } from './types';
import { GOAPPlanner } from './Planner';

/**
 * Agent class that manages planning and execution of actions to achieve goals
 * using GOAP (Goal-Oriented Action Planning).
 */
export class Agent {
  private worldState: WorldState;
  private planner: GOAPPlanner;
  private currentPlan: Action[];

  /**
   * Creates a new Agent instance.
   * @param initialState - The initial world state for the agent
   */
  constructor(initialState: WorldState) {
    this.worldState = initialState;
    this.planner = new GOAPPlanner();
    this.currentPlan = [];
  }

  /**
   * Adds an action to the agent's available actions.
   * @param action - The action to add to the planner
   */
  addAction(action: Action): void {
    this.planner.addAction(action);
  }

  /**
   * Attempts to execute a plan to achieve the specified goal.
   * @param goal - The goal state to achieve
   * @returns Promise that resolves to true if plan execution was successful, false otherwise
   */
  async executePlan(goal: Goal): Promise<boolean> {
    this.currentPlan = this.planner.findPlan(this.worldState, goal);

    if (this.currentPlan.length === 0) {
      return false;
    }

    const initialState = { ...this.worldState };

    try {
      for (const action of this.currentPlan) {
        if (action.execute) {
          await action.execute();
        }
        this.worldState = this.updateWorldState(this.worldState, action);
      }
      return true;
    } catch (error) {
      // Rollback to initial state if any action fails
      this.worldState = initialState;
      return false;
    }
  }

  /**
   * Updates the world state based on an action's effects.
   * @param state - The current world state
   * @param action - The action whose effects should be applied
   * @returns Updated world state after applying the action's effects
   * @private
   */
  private updateWorldState(state: WorldState, action: Action): WorldState {
    const newState = { ...state };
    action.effects.forEach((effect) => {
      const value = typeof effect.value === 'function' ? effect.value(state) : effect.value;
      newState[effect.key] = value;
    });
    return newState;
  }

  /**
   * Returns a copy of the current world state.
   * @returns Copy of the current world state
   */
  getCurrentState(): WorldState {
    return { ...this.worldState };
  }
}
