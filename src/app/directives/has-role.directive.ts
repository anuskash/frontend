import { Directive, Input, TemplateRef, ViewContainerRef, OnInit } from '@angular/core';
import { PermissionsService } from '../services/permissions.service';

@Directive({
  selector: '[appHasRole]',
  standalone: false
})
export class HasRoleDirective implements OnInit {
  @Input() appHasRole: string | string[] = [];

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissions: PermissionsService
  ) {}

  ngOnInit() {
    this.updateView();
  }

  private updateView() {
    const roles = Array.isArray(this.appHasRole) ? this.appHasRole : [this.appHasRole];
    const hasPermission = this.permissions.hasAnyRole(roles);

    if (hasPermission) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
