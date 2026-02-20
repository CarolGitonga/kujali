import { RestRegistrar } from '@ngfi/functions';

import { KujaliFunction } from '../../../environments/kujali-func.class';
import { AddNoteToBudgetHandler } from '@app/functions/finance/budgeting';

const addNoteToBudgetHandler = new AddNoteToBudgetHandler();

export const addNoteToBudget = new KujaliFunction(
                                'addNoteToBudget',
                                new RestRegistrar(),
                                [],
                                addNoteToBudgetHandler)
                                .build();
