// Copyright 2017 The Kubernetes Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, OnDestroy, OnInit} from '@angular/core';
import {Service, ServiceList, VirtualService} from '@api/backendapi';
import {ColumnWhenCondition} from '@api/frontendapi';
import {StateService} from '@uirouter/core';
import {Subscription} from 'rxjs/Subscription';

import {ActionbarService, ResourceMeta} from '../../../../common/services/global/actionbar';
import {GlobalServicesModule} from '../../../../common/services/global/module';
import {NotificationsService} from '../../../../common/services/global/notifications';
import {KdStateService} from '../../../../common/services/global/state';
import {EndpointManager, Resource} from '../../../../common/services/resource/endpoint';
import {NamespacedResourceService} from '../../../../common/services/resource/resource';

// import { ServiceList } from '../../service/list/component';

@Component({
  selector: 'kd-virtual-service-detail',
  templateUrl: './template.html',
})
export class VirtualServiceComponent implements OnInit, OnDestroy {
  private virtualServiceDetailSubscription_: Subscription;
  private virtualServiceSetName_: string;
  private data_: Service[];
  private readonly dynamicColumns_: ColumnWhenCondition[] = [];
  private readonly kdState_: KdStateService;
  virtualService: VirtualService;
  isInitialized = false;
  displayedColumns: string[] =
      ['name', 'labels', 'clusterip', 'internalendp', 'externalendp', 'age'];
  constructor(
      private readonly virtualService_: NamespacedResourceService<VirtualService>,
      private readonly actionbar_: ActionbarService, private readonly state_: StateService,
      private readonly notifications_: NotificationsService) {
    this.kdState_ = GlobalServicesModule.injector.get(KdStateService);
  }

  ngOnInit(): void {
    this.virtualServiceSetName_ = this.state_.params.resourceName;
    this.virtualServiceDetailSubscription_ =
        this.virtualService_
            .get(
                EndpointManager.resource(Resource.virtualservice, true).detail(),
                this.virtualServiceSetName_)
            .startWith({})
            .subscribe((d: VirtualService) => {
              this.virtualService = d;
              this.data_ = this.map(d.serviceList);
              this.notifications_.pushErrors(d.errors);
              this.actionbar_.onInit.emit(
                  new ResourceMeta('Virtual Service', d.objectMeta, d.typeMeta));
              this.isInitialized = true;
            });
  }
  getData(): Service[] {
    return this.data_;
  }
  map(serviceList: ServiceList): Service[] {
    return serviceList ? serviceList.services : [];
  }

  getDetailsHref(resourceName: string, namespace?: string): string {
    return this.kdState_.href('service', resourceName, namespace);
  }
  shouldShowColumn(dynamicColName: string): boolean {
    const col = this.dynamicColumns_.find((condition) => {
      return condition.col === dynamicColName;
    });
    if (col !== undefined) {
      return col.whenCallback();
    }

    return false;
  }
  ngOnDestroy(): void {
    this.virtualServiceDetailSubscription_.unsubscribe();
  }
}
