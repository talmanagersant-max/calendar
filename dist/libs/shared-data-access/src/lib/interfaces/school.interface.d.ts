export interface ISchool {
    id: string;
    name: string;
    leaId: string;
    gradeBand: string;
    studentCount: number;
    city: string;
    status: 'Open' | 'Operational' | 'Review';
}
