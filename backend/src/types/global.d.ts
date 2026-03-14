declare interface ITypeHttpStatusCodes {
  Created: 201;
  NotFound?: 404;
  InternalServerError?: 500;
}


declare interface ITypeSuccess<V> {
  code: ITypeHttpStatusCodes.Created;
  status: number;
  error: null;
  payload: V;
}


declare interface ITypeReturnResponse<V = null> {
  code: number;
  status: number;
  error: string | null | object | number | boolean;
  payload: V;
}
