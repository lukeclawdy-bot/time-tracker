const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://time-tracker-production-f3f7.up.railway.app';

export interface TimeEntry {
  id: number;
  start_time: string;
  end_time: string;
  project: string;
  notes: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectStats {
  project: string;
  total_entries: number;
  total_hours: number;
  first_entry: string;
  last_entry: string;
}

export interface CreateEntryData {
  start_time: string;
  end_time: string;
  project: string;
  notes: string;
}

export interface UpdateEntryData {
  start_time?: string;
  end_time?: string;
  project?: string;
  notes?: string;
}

export interface GetEntriesParams {
  project?: string;
  limit?: number;
  offset?: number;
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async getEntries(params?: GetEntriesParams): Promise<TimeEntry[]> {
    const queryParams = new URLSearchParams();
    if (params?.project) queryParams.append('project', params.project);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const query = queryParams.toString();
    const response = await this.request<{ success: boolean; data: TimeEntry[] }>(`/api/entries${query ? `?${query}` : ''}`);
    return response.data;
  }

  async getEntry(id: number): Promise<TimeEntry> {
    const response = await this.request<{ success: boolean; data: TimeEntry }>(`/api/entries/${id}`);
    return response.data;
  }

  async createEntry(data: CreateEntryData): Promise<TimeEntry> {
    const response = await this.request<{ success: boolean; data: TimeEntry }>('/api/entries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async updateEntry(id: number, data: UpdateEntryData): Promise<TimeEntry> {
    const response = await this.request<{ success: boolean; data: TimeEntry }>(`/api/entries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async deleteEntry(id: number): Promise<void> {
    await this.request<{ success: boolean }>(`/api/entries/${id}`, {
      method: 'DELETE',
    });
  }

  async getStats(): Promise<ProjectStats[]> {
    const response = await this.request<{ success: boolean; data: ProjectStats[] }>('/api/stats');
    return response.data;
  }
}

export const api = new ApiClient();
