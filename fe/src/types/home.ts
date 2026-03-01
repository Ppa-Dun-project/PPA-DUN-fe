 export interface NewsItem {                                                                                        
    id: string;                                                                                                      
    title: string;                                                                                                   
    summary: string;                                                                                                 
    publishedAt: string;                                                                                             
    url: string;  
    source?: string;
  }

  export interface TopPlayer {
    id: string;
    name: string;
    team: string;
    positions: string[];
    valueScore: number;
  }