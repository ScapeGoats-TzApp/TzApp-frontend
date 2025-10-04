import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { NavigationComponent } from '../components/navigation';

@Component({
  selector: 'app-location',
  standalone: true,
  imports: [CommonModule, NavigationComponent],
  template: `
    <div class="min-h-screen bg-gradient-main pb-24 overflow-x-hidden">
      <div class="max-w-[412px] mx-auto px-[6px]">
        <!-- Header with Save button -->
        <div class="flex items-center justify-between pt-4 mb-4">
          <h1 class="text-navy font-bold text-4xl uppercase" style="letter-spacing: -2.52px;">{{ locationName }}</h1>
          <button class="px-6 py-2 bg-cyan-light/20 rounded-[20px] border-b border-cyan flex items-center gap-2">
            <span class="text-navy-90 font-bold text-sm capitalize" style="letter-spacing: -1.05px;">Save</span>
            <svg class="w-7 h-7" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9C6 7.11438 6 6.17157 6.58579 5.58579C7.17157 5 8.11438 5 10 5H20C21.8856 5 22.8284 5 23.4142 5.58579C24 6.17157 24 7.11438 24 9V23.5C24 24.3284 24 24.7426 23.8478 25.0481C23.6955 25.3536 23.4065 25.5429 22.8284 25.9216L16.5 29.5L10.1716 25.9216C9.59351 25.5429 9.30448 25.3536 9.15224 25.0481C9 24.7426 9 24.3284 9 23.5V22.5" stroke="#26658C" stroke-opacity="0.9" stroke-width="1.5"/>
            </svg>
          </button>
        </div>

        <!-- Current Weather Card -->
        <div class="bg-cyan-light/20 rounded-[20px] border-b border-cyan p-4 mb-4 relative">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <img 
                src="https://api.builder.io/api/v1/image/assets/TEMP/bdf6f8e90469a9e3388a9ed3b16dc186e764dc15?width=160" 
                alt="Weather icon" 
                class="w-[80px] h-[120px]"
              />
              <div>
                <p class="text-navy-90 font-bold text-4xl" style="letter-spacing: -2.52px;">2°C</p>
                <p class="text-navy-90 font-bold text-sm" style="letter-spacing: -1.05px;">Sunny</p>
                <p class="text-navy-90 font-bold text-2xl" style="letter-spacing: -1.68px;">H:04°</p>
                <p class="text-navy-90 font-bold text-2xl" style="letter-spacing: -1.68px;">L:-5°</p>
              </div>
            </div>
            <img 
              src="https://api.builder.io/api/v1/image/assets/TEMP/69135c87e725cbe79abd4f7d8a33ec4cdd5b4437?width=284" 
              alt="Goat skiing" 
              class="w-[142px] h-auto absolute right-4 top-8"
            />
          </div>
        </div>

        <!-- Hourly Forecast -->
        <div class="bg-cyan-light/20 rounded-[20px] border-b border-cyan p-4 mb-4">
          <p class="text-navy-50 font-bold text-xs uppercase mb-3" style="letter-spacing: -0.11px;">37/Feb/2069 forecast</p>
          
          <div class="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            <div class="flex flex-col items-center min-w-[30px]">
              <p class="text-navy-50 font-bold text-xs mb-2">Now</p>
              <img src="https://api.builder.io/api/v1/image/assets/TEMP/6bd058e86a0b82880e5e337cfd6a01e6ce0fd7d4?width=60" alt="" class="w-7 h-7 mb-2" />
              <p class="text-navy-50 font-bold text-xs">19°</p>
            </div>
            <div class="flex flex-col items-center min-w-[30px]">
              <p class="text-navy-50 font-bold text-xs mb-2">12</p>
              <img src="https://api.builder.io/api/v1/image/assets/TEMP/6bd058e86a0b82880e5e337cfd6a01e6ce0fd7d4?width=60" alt="" class="w-7 h-7 mb-2" />
              <p class="text-navy-50 font-bold text-xs">19°</p>
            </div>
            <div class="flex flex-col items-center min-w-[30px]">
              <p class="text-navy-50 font-bold text-xs mb-2">13</p>
              <img src="https://api.builder.io/api/v1/image/assets/TEMP/6bd058e86a0b82880e5e337cfd6a01e6ce0fd7d4?width=60" alt="" class="w-7 h-7 mb-2" />
              <p class="text-navy-50 font-bold text-xs">19°</p>
            </div>
            <div class="flex flex-col items-center min-w-[30px]">
              <p class="text-navy-50 font-bold text-xs mb-2">14</p>
              <img src="https://api.builder.io/api/v1/image/assets/TEMP/6bd058e86a0b82880e5e337cfd6a01e6ce0fd7d4?width=60" alt="" class="w-7 h-7 mb-2" />
              <p class="text-navy-50 font-bold text-xs">19°</p>
            </div>
            <div class="flex flex-col items-center min-w-[30px]">
              <p class="text-navy-50 font-bold text-xs mb-2">15</p>
              <img src="https://api.builder.io/api/v1/image/assets/TEMP/6bd058e86a0b82880e5e337cfd6a01e6ce0fd7d4?width=60" alt="" class="w-7 h-7 mb-2" />
              <p class="text-navy-50 font-bold text-xs">19°</p>
            </div>
            <div class="flex flex-col items-center min-w-[30px]">
              <p class="text-navy-50 font-bold text-xs mb-2">16</p>
              <img src="https://api.builder.io/api/v1/image/assets/TEMP/6bd058e86a0b82880e5e337cfd6a01e6ce0fd7d4?width=60" alt="" class="w-7 h-7 mb-2" />
              <p class="text-navy-50 font-bold text-xs">19°</p>
            </div>
            <div class="flex flex-col items-center min-w-[30px]">
              <p class="text-navy-50 font-bold text-xs mb-2">17</p>
              <img src="https://api.builder.io/api/v1/image/assets/TEMP/6bd058e86a0b82880e5e337cfd6a01e6ce0fd7d4?width=60" alt="" class="w-7 h-7 mb-2" />
              <p class="text-navy-50 font-bold text-xs">19°</p>
            </div>
            <div class="flex flex-col items-center min-w-[30px]">
              <p class="text-navy-50 font-bold text-xs mb-2">18</p>
              <img src="https://api.builder.io/api/v1/image/assets/TEMP/6bd058e86a0b82880e5e337cfd6a01e6ce0fd7d4?width=60" alt="" class="w-7 h-7 mb-2" />
              <p class="text-navy-50 font-bold text-xs">19°</p>
            </div>
            <div class="flex flex-col items-center min-w-[30px]">
              <p class="text-navy-50 font-bold text-xs mb-2">19</p>
              <img src="https://api.builder.io/api/v1/image/assets/TEMP/6bd058e86a0b82880e5e337cfd6a01e6ce0fd7d4?width=60" alt="" class="w-7 h-7 mb-2" />
              <p class="text-navy-50 font-bold text-xs">19°</p>
            </div>
            <div class="flex flex-col items-center min-w-[30px]">
              <p class="text-navy-50 font-bold text-xs mb-2">20</p>
              <img src="https://api.builder.io/api/v1/image/assets/TEMP/6bd058e86a0b82880e5e337cfd6a01e6ce0fd7d4?width=60" alt="" class="w-7 h-7 mb-2" />
              <p class="text-navy-50 font-bold text-xs">19°</p>
            </div>
          </div>
        </div>

        <!-- Precipitation Map -->
        <div class="bg-cyan-light/20 rounded-[20px] border-b border-cyan p-4 mb-4">
          <p class="text-navy-50 font-bold text-xs uppercase mb-2" style="letter-spacing: -0.11px;">Precipitation</p>
          <div class="w-full h-[259px] rounded-[20px] overflow-hidden">
            <img 
              src="https://api.builder.io/api/v1/image/assets/TEMP/146f8003b28ff3d65697a720e68e5d83dfe625c3?width=815" 
              alt="Precipitation map" 
              class="w-full h-full object-cover"
            />
          </div>
        </div>

        <!-- Info Grid -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <!-- Feels Like -->
          <div class="bg-cyan-light/20 rounded-[20px] border-b border-cyan p-4">
            <p class="text-navy-50 font-bold text-xs uppercase mb-2" style="letter-spacing: -0.11px;">FEELS LIKE</p>
            <p class="text-navy-50 font-bold text-4xl mb-1" style="letter-spacing: -0.36px;">19°</p>
            <p class="text-navy-50 font-bold text-sm lowercase mb-2">actual: 23°</p>
            <div class="flex items-center gap-2 mb-2">
              <p class="text-navy-50 font-bold text-sm lowercase">4°</p>
            </div>
            <div class="h-px bg-gradient-to-r from-navy to-cyan-light/40 mb-2"></div>
            <p class="text-navy-50 font-bold text-xs lowercase leading-tight">It feels colder than the actual temperature</p>
          </div>

          <!-- Elevation -->
          <div class="bg-cyan-light/20 rounded-[20px] border-b border-cyan p-4">
            <p class="text-navy-50 font-bold text-xs uppercase mb-2" style="letter-spacing: -0.11px;">ELEVATION</p>
            <p class="text-navy-50 font-bold text-4xl mb-1" style="letter-spacing: -0.36px;">100</p>
            <p class="text-navy-50 font-bold text-sm lowercase mb-2">meter</p>
            <p class="text-navy-50 font-bold text-sm lowercase leading-tight mb-1">above sea level</p>
            <p class="text-navy-50 font-bold text-xs uppercase leading-tight">44°18'47.6"N<br>23°47'33.0"E</p>
          </div>
        </div>
      </div>

      <app-navigation></app-navigation>
    </div>
  `,
  styles: [`
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `]
})
export class LocationPage {
  locationName: string = 'CIOROGARLA';

  constructor(private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      this.locationName = params['id']?.toUpperCase() || 'CIOROGARLA';
    });
  }
}
