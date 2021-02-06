import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root'
})
export class SearchService {
  constructor(private http: HttpClient) { }

  getTopicContent(topic: string) {
    let httpHeaders = new HttpHeaders()
      .set('Accept', 'application/json');
    let params = new HttpParams();
    params = params.append('item', topic);
    return this.http.get<any>('http://127.0.0.1:3000/topics', { headers: httpHeaders, params: params, responseType: 'json' });

  }

}
