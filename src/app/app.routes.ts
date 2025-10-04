import { Routes } from '@angular/router';
import { LoadingComponent } from './pages/loading/loading';
import { HomePage } from './pages/home/home';
import { ExplorePage } from './pages/explore/explore';
import { SavedComponent } from './pages/saved/saved';
import { LocationComponent } from './pages/location/location';

export const routes: Routes = [
  { path: '', component: LoadingComponent },
  { path: 'home', component: HomePage },
  { path: 'explore', component: ExplorePage },
  { path: 'saved', component: SavedComponent },
  { path: 'location/:id', component: LocationComponent },
  { path: '**', redirectTo: '' }
];
