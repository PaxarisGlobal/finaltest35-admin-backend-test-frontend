import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ApiService, Product } from '../../../core/services/api.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit, AfterViewInit {
  items: Product[] = [];
  dataSource = new MatTableDataSource<Product>();
  displayedColumns: string[] = ['name', 'email', 'company', 'actions'];
  loading = false;
  showAddForm = false;
  isEditMode = false;
  selectedItem: Product | null = null;
  form: FormGroup;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private apiService: ApiService,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.form = this.formBuilder.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      company: [''],
    });
  }

  ngOnInit(): void {
    this.loadItems();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadItems(): void {
    this.loading = true;
    this.apiService.getProducts().subscribe({
      next: (items) => {
        this.items = items;
        this.dataSource.data = items;
        this.loading = false;
      },
      error: (error) => {
        this.showError('Failed to load products.');
        console.error(error);
        this.loading = false;
      }
    });
  }

  saveItem(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const payload = this.form.getRawValue();
    const request = this.isEditMode && this.selectedItem
      ? this.apiService.updateProduct(this.selectedItem.id, payload)
      : this.apiService.createProduct(payload);

    request.subscribe({
      next: () => {
        this.showSuccess('Product saved successfully.');
        this.cancelEdit();
        this.loadItems();
      },
      error: (error) => {
        this.showError('Failed to save product.');
        console.error(error);
        this.loading = false;
      }
    });
  }

  editItem(item: Product): void {
    this.selectedItem = { ...item };
    this.isEditMode = true;
    this.showAddForm = true;
    this.form.patchValue({
      name: item.name,
      email: item.email,
      company: item.company,
    });
  }

  deleteItem(item: Product): void {
    if (!confirm(`Delete ${item.name}?`)) {
      return;
    }

    this.loading = true;
    this.apiService.deleteProduct(item.id).subscribe({
      next: () => {
        this.showSuccess('Product deleted successfully.');
        this.loadItems();
      },
      error: (error) => {
        this.showError('Failed to delete product.');
        console.error(error);
        this.loading = false;
      }
    });
  }

  cancelEdit(): void {
    this.loading = false;
    this.showAddForm = false;
    this.isEditMode = false;
    this.selectedItem = null;
    this.form.reset({
      name: '',
      email: '',
      company: '',
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldErrorMessage(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (!field || !field.errors) {
      return '';
    }
    if (field.errors['required']) {
      return `${fieldName} is required`;
    }
    if (field.errors['email']) {
      return 'Enter a valid email address';
    }
    return 'Invalid value';
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 5000 });
  }
}
