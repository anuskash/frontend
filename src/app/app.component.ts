import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, mergeMap, Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'uon-marketplace';
  showShell = true;

  private sub?: Subscription;

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Toggle global layout (navbar/footer) based on route data.standaloneLayout
    // Check both the route and its parent routes for the standaloneLayout flag
    this.sub = this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => {
        // Start from the activated route and traverse up to check for standaloneLayout
        let route = this.route;
        while (route.firstChild) {
          route = route.firstChild;
        }
        
        // Check current route and all parent routes for standaloneLayout data
        let currentRoute: ActivatedRoute | null = route;
        while (currentRoute) {
          if (currentRoute.snapshot.data && currentRoute.snapshot.data['standaloneLayout'] === true) {
            return true;
          }
          currentRoute = currentRoute.parent;
        }
        return false;
      })
    ).subscribe((hideShell) => {
      this.showShell = !hideShell;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
