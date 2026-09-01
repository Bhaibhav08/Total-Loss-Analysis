import { Routes } from '@angular/router';

import { Dashboard } from './pages/dashboard/dashboard';
import { Stores } from './pages/stores/stores';
import { Investigations } from './pages/investigations/investigations';
import { StoreDetails } from './pages/investigations/store-details/store-details';
import { AiAnalysis } from './pages/ai-analysis/ai-analysis';
import { Transactions } from './pages/transactions/transactions';
import { Inventory } from './pages/inventory/inventory';
import { Products } from './pages/products/products';
import { Login } from './pages/login/login';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'dashboard',
    component: Dashboard
  },
  {
    path: 'stores',
    component: Stores
  },
  {
    path: 'investigations',
    component: Investigations
  },
  {
    path: 'investigations/:storeId',
    component: StoreDetails
  },
  {
    path: 'transactions',
    component: Transactions
  },
  {
    path: 'inventory',
    component: Inventory
  },
  {
    path: 'products',
    component: Products
  },
  {
    path: 'ai-analysis',
    component: AiAnalysis
  },
  {
    path: 'ai-analysis/:storeId',
    component: AiAnalysis
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];