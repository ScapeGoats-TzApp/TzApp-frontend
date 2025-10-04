import { Routes } from '@angular/router';
import { LoadingPage } from './pages/loading';
import { HomePage } from './pages/home/home';
import { ExplorePage } from './pages/explore/explore';
import { SavedPage } from './pages/saved';
import { LocationPage } from './pages/location';

export const routes: Routes = [
  { path: '', component: LoadingPage },
  { path: 'home', component: HomePage },
  { path: 'explore', component: ExplorePage },
  { path: 'saved', component: SavedPage },
  { path: 'location/:id', component: LocationPage },
  { path: '**', redirectTo: '' }
];
