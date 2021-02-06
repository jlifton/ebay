import { Component, OnInit } from '@angular/core';
import { SearchService } from '../services/search-service.service';

export interface TopicContentEntry {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}

@Component({
  selector: 'app-search-component',
  templateUrl: './search-component.component.html',
  styleUrls: ['./search-component.component.css']
})

export class SearchComponent implements OnInit {
  total = 0;
  status = 'status_ready';
  searchText = '';
  topicContentList: TopicContentEntry[] = [];
  displayedColumns: string[] = ['word', 'rank'];

  constructor(private searchService: SearchService) { }

  ngOnInit(): void {
  }

  onSearch() {
    this.total = 0;
    this.status = 'status_pending';
    this.searchService.getTopicContent(this.searchText).subscribe((response) => {
      console.log('Results:' + JSON.stringify(response));
      this.status = 'status_success';
      this.topicContentList = response.processed;
      this.total = this.topicContentList ? this.topicContentList.length : 0;
    },
      err => {
        console.log('HTTP Error', err);
        this.status = 'status_error';
        alert('Problem searching. Please check environment');
      });

  }

  formatRank(rank) {
    switch (rank) {
      case 1:
        return '*';
      case 2:
        return '**';
      case 3:
        return '***';
      case 4:
        return '****';
      case 5:
        return '*****';
      default:
        return '?';

    }
  }

  onClear() {
    this.searchText = '';
    this.status = 'ready;'
  }

}
