export interface ILea {
    id: string;
    name: string;
    region: string;
    contact: string;
    email: string;
    status: 'Active' | 'Pending' | 'Review';
}
