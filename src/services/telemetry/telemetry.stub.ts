// Stub seguro para o ambiente Figma — todas as funções são NO-OP
export class TelemetryServiceStub {

    constructor(_options?: any) {}

    // ---- Métodos de log ----
    log(_msg: string, _data?: any) { return; }
    event(_name: string, _data?: any) { return; }
    metric(_name: string, _value?: any) { return; }

    // ---- Ciclo de execução ----
    start(_label?: string) { return; }
    end(_label?: string) { return; }

    // ---- Comparação e inspeção ----
    snapshot(_label: string, _payload: any) { return; }
    diff(_label: string, _before: any, _after: any) { return; }

    // ---- Controle ----
    enable() { return; }
    disable() { return; }
    setOptions(_opts: any) { return; }
    attach(_context: any) { return; }

    // ---- Finalização ----
    flush() { return; }
    write() { return; }
}
