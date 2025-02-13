import { PriorityQueue } from './PriorityQueue';
import { WorldState, Action, Goal, ActionPrecondition, ActionEffect } from './types';

/**
 * Represents a node in the planning graph containing state, actions, cost, and priority information.
 */
interface PlanNode {
  state: WorldState;
  actions: Action[];
  cost: number;
  priority: number;
}

/**
 * Goal-Oriented Action Planning (GOAP) implementation for automated planning and problem solving.
 * This planner uses A* search with custom heuristics to find optimal action sequences.
 */
export class GOAPPlanner {
  private actions: Action[] = [];
  private maxIterations = 1000;
  private resourceKeys: Set<string> = new Set();

  /**
   * Adds a new action to the planner's available action set.
   * @param action The action to add
   */
  addAction(action: Action): void {
    this.actions.push(action);
  }

  /**
   * Removes an action from the planner's available action set.
   * @param actionName The name of the action to remove
   */
  removeAction(actionName: string): void {
    this.actions = this.actions.filter((a) => a.name !== actionName);
  }

  private evaluateStateProgress(state: WorldState): number {
    // Calculate progress towards meeting preconditions for goal actions
    let progress = 0;
    const goalActions = this.actions.filter((action) =>
      action.effects.some((effect) => effect.key === 'goal' && effect.value === true)
    );

    for (const action of goalActions) {
      for (const precond of action.preconditions) {
        if (precond.operator === 'greaterThan' || precond.operator === 'greaterThanOrEqual') {
          const current = state[precond.key] || 0;
          const target = precond.value;
          progress += Math.min(1, current / target);
        }
      }
    }

    return progress;
  }

  private projectFutureCosts(state: WorldState, goal: Goal): number {
    // TODO: Checking if the action's effects contribute to the actual goal conditions. Use the goal parameter to calculate costs based on how actions contribute to the specific goal conditions.
    let projection = 0;

    // Find all actions that could satisfy the goal
    const goalActions = this.actions.filter((action) =>
      action.effects.some((effect) => effect.key === 'goal' && effect.value === true)
    );

    // For each potential goal action, calculate minimum cost to meet its preconditions
    for (const action of goalActions) {
      let actionProjection = 0;
      let requiredResources = 0;

      for (const precond of action.preconditions) {
        if (precond.operator === 'greaterThan' || precond.operator === 'greaterThanOrEqual') {
          const current = state[precond.key] || 0;
          const target = precond.value;

          if (current <= target) {
            // Calculate cost of reaching target with AddResources
            const resourcesNeeded = target - current;
            const addResourceCost = Math.ceil(resourcesNeeded / 5); // AddResources adds 5 at cost 1
            actionProjection += addResourceCost;
            requiredResources = Math.max(requiredResources, target);
          }
        }
      }

      // Add the cost of the goal action itself
      const finalStateCost =
        typeof action.cost === 'function'
          ? action.cost({ ...state, resources: requiredResources })
          : action.cost;

      actionProjection += finalStateCost;

      // Keep track of minimum projected cost path
      if (projection === 0 || actionProjection < projection) {
        projection = actionProjection;
      }
    }

    return projection;
  }

  /**
   * Finds an optimal sequence of actions to achieve the specified goal from the initial state.
   * Uses A* search with custom heuristics for efficient planning.
   * @param initialState The starting world state
   * @param goal The goal conditions to achieve
   * @returns An array of actions that achieve the goal, or empty array if no solution is found
   */
  findPlan(initialState: WorldState, goal: Goal): Action[] {
    const queue = new PriorityQueue<PlanNode>((a, b) => {
      // Prefer paths that are closer to meeting preconditions for goal actions
      if (a.priority === b.priority) {
        return this.evaluateStateProgress(b.state) - this.evaluateStateProgress(a.state);
      }
      return a.priority - b.priority;
    });

    const visited = new Map<string, number>();
    let iterations = 0;
    let bestPlan: Action[] | null = null;
    let bestCost = Infinity;

    queue.enqueue({
      state: initialState,
      actions: [],
      cost: 0,
      priority: 0,
    });

    while (!queue.isEmpty() && iterations < this.maxIterations) {
      iterations++;
      const current = queue.dequeue();
      if (!current) continue;

      if (this.satisfiesGoal(current.state, goal)) {
        if (current.cost < bestCost) {
          bestPlan = current.actions;
          bestCost = current.cost;
        }
        continue;
      }

      const stateHash = this.getStateHash(current.state);
      const visitCount = visited.get(stateHash) || 0;
      if (visitCount > 10) continue;

      visited.set(stateHash, visitCount + 1);

      // Get all valid actions for current state
      const validActions = this.actions.filter((action) =>
        this.checkPreconditions(current.state, action.preconditions)
      );

      for (const action of validActions) {
        const newState = this.applyEffects(current.state, action.effects);
        const actionCost = this.calculateActionCost(action, current.state);
        const totalCost = current.cost + actionCost;

        if (totalCost >= bestCost) continue;

        // Project future costs based on remaining requirements
        const projectedCost = this.projectFutureCosts(newState, goal);
        const priority = totalCost + projectedCost;

        queue.enqueue({
          state: { ...newState },
          actions: [...current.actions, action],
          cost: totalCost,
          priority,
        });
      }
    }

    return bestPlan || [];
  }

  private calculateHeuristic(state: WorldState, goal: Goal): number {
    let estimate = 0;
    let resourceNeeded = 0;

    // Check if we need more resources for any available actions
    for (const action of this.actions) {
      for (const precond of action.preconditions) {
        if (precond.operator === 'greaterThan' || precond.operator === 'greaterThanOrEqual') {
          const required = precond.value;
          const current = state[precond.key] || 0;
          if (current <= required) {
            resourceNeeded = Math.max(resourceNeeded, required - current);
          }
        }
      }
    }

    // Add resource gathering cost to heuristic
    if (resourceNeeded > 0) {
      // Assume we need to gather resources at base cost
      estimate += Math.ceil(resourceNeeded / 5); // Assuming AddResources adds 5 at cost 1
    }

    // Add goal satisfaction cost
    for (const condition of goal.conditions) {
      if (!this.checkPrecondition(state, condition)) {
        if (typeof condition.value === 'number' && typeof state[condition.key] === 'number') {
          estimate += Math.abs((state[condition.key] || 0) - condition.value);
        } else {
          estimate += 1;
        }
      }
    }

    return estimate;
  }

  private getStateHash(state: WorldState): string {
    // Include both regular state and consumption tracking in hash
    const stateEntries = Object.entries(state)
      .filter(([key]) => !key.endsWith('_consumed'))
      .sort(([a], [b]) => a.localeCompare(b));

    const consumedEntries = Object.entries(state)
      .filter(([key]) => key.endsWith('_consumed'))
      .sort(([a], [b]) => a.localeCompare(b));

    return JSON.stringify({
      state: stateEntries,
      consumed: consumedEntries,
    });
  }

  private calculateActionCost(action: Action, state: WorldState): number {
    // For dynamic cost actions, evaluate their potential future cost
    if (typeof action.cost === 'function') {
      const projectedState = this.applyEffects(state, action.effects);
      return action.cost(projectedState);
    }
    return action.cost;
  }

  /**
   * Marks a state key as representing a consumable resource.
   * Marked resources will be tracked for consumption status.
   * @param key The state key to mark as a resource
   */
  markAsResource(key: string): void {
    this.resourceKeys.add(key);
  }

  /**
   * Clears all resource tracking markers.
   */
  clearResourceTracking(): void {
    this.resourceKeys.clear();
  }

  /**
   * Applies a sequence of effects to a world state.
   * @param state Current world state
   * @param effects Array of effects to apply
   * @returns New world state after applying effects
   * @private
   */
  private applyEffects(state: WorldState, effects: ActionEffect[]): WorldState {
    const newState = { ...state };

    for (const effect of effects) {
      const prevValue = newState[effect.key];
      const value = typeof effect.value === 'function' ? effect.value(newState) : effect.value;

      // Track resource consumption
      if (this.resourceKeys.has(effect.key)) {
        if (typeof value === 'number' && typeof prevValue === 'number') {
          if (value < prevValue) {
            // Mark as consumed only when resources are actually reduced
            newState[`${effect.key}_consumed`] = true;
          } else {
            // Reset consumed flag when resources are replenished
            delete newState[`${effect.key}_consumed`];
          }
        }
      }

      newState[effect.key] = value;
    }

    return newState;
  }

  /**
   * Checks if all preconditions are satisfied in the given state.
   * @param state Current world state
   * @param preconditions Array of preconditions to check
   * @returns True if all preconditions are satisfied
   * @private
   */
  private checkPreconditions(state: WorldState, preconditions: ActionPrecondition[]): boolean {
    return preconditions.every((condition) => {
      if (
        this.resourceKeys.has(condition.key) &&
        condition.operator === 'greaterThanOrEqual' &&
        state[`${condition.key}_consumed`]
      ) {
        return false;
      }
      return this.checkPrecondition(state, condition);
    });
  }

  /**
   * Checks if a single precondition is satisfied in the given state.
   * @param state Current world state
   * @param condition Precondition to check
   * @returns True if the precondition is satisfied
   * @private
   */
  private checkPrecondition(state: WorldState, condition: ActionPrecondition): boolean {
    const stateValue = state[condition.key];
    const conditionValue =
      typeof condition.value === 'function' ? condition.value(state) : condition.value;

    switch (condition.operator) {
      case 'greaterThan':
        return stateValue > conditionValue;
      case 'lessThan':
        return stateValue < conditionValue;
      case 'greaterThanOrEqual':
        return stateValue >= conditionValue;
      case 'lessThanOrEqual':
        return stateValue <= conditionValue;
      case 'notEquals':
        return stateValue !== conditionValue;
      case 'equals':
      default:
        return stateValue === conditionValue;
    }
  }

  /**
   * Checks if the current state satisfies all goal conditions.
   * @param state Current world state
   * @param goal Goal to check
   * @returns True if all goal conditions are satisfied
   * @private
   */
  private satisfiesGoal(state: WorldState, goal: Goal): boolean {
    return goal.conditions.every((condition) => this.checkPrecondition(state, condition));
  }
}
