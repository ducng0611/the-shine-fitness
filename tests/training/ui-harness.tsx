/** TEST HARNESS ONLY. Not an application route or authentication fallback. */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { TrainingWorkspace } from '../../src/components/training/TrainingWorkspace';
import { TrainingApiError, type TrainingApi } from '../../src/components/training/api';
const api:TrainingApi={
  async request<T>(path:string,method='GET',body?:unknown):Promise<T>{const response=await fetch('/api/companion/training'+path,{method,headers:{'Content-Type':'application/json',Authorization:'Bearer ui-test-member'},...(body===undefined?{}:{body:JSON.stringify(body)})});const value=await response.json();if(!response.ok)throw new TrainingApiError(value.code,value.error,response.status);return value as T;},abort(){}
};
createRoot(document.getElementById('root')!).render(<TrainingWorkspace uid="ui-test-member" lang={new URLSearchParams(location.search).get('lang')??'en'} api={api}/>);
