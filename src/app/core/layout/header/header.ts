import { Component, inject } from '@angular/core';
import { TrackingStateService } from '../../services/tracking-state.service';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  // Inject tracking state service for centralized data management
  readonly stateService = inject(TrackingStateService);

  // Handle raw file upload (CSV or JSON) and pass it to the state service parser
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.stateService.loadRawFile(file);
    }
  }
}
