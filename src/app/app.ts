import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  public themeService = inject(ThemeService);

  // small title helper used by the template
  title = () => 'CareerSeed';

  constructor() {
    // ThemeService is constructed and applies persisted theme on startup.
  }
}
