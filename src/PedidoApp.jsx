// ✅ Código actualizado con asteriscos en token y campo de comentarios
import React, { useEffect, useState } from "react";
import Select from "react-select";

const CLIENTES_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSKax5qR7rcDOLBKtZqhHFvD2U1INj5kWvfsSE2smhLSk2Y9nEfVws2X81B-JE1t2gStdUMoc9ttlM4/pub?gid=0&single=true&output=csv";

const PRODUCTOS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSKax5qR7rcDOLBKtZqhHFvD2U1INj5kWvfsSE2smhLSk2Y9nEfVws2X81B-JE1t2gStdUMoc9ttlM4/pub?gid=797464977&single=true&output=csv";

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyEHCAZ2G3WGpgeu3vCj11TT8PBDnOCF7fS33mYQd8PPdADIZ0Uz2Q4ob3rACdDTtX86Q/exec";

const TOKENS_VALIDOS = ["1230", "4560", "7890", "1011", "1213", "1415", "1617"];
const NOMBRES_VENDEDORES = ["Oscar Zuniga", "Vanessa Perez", "Karen Turcios", "Saul Rivas", "Jaime Ramirez", "Johanna Vides", "Oficina"];

function csvToJson(csv) {
  const lines = csv.trim().split("\n");
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const data = line.split(",");
    const obj = {};
    headers.forEach((header, i) => {
      obj[header.trim()] = data[i]?.trim();
    });
    return obj;
  });
}

function App() {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidadSeleccionada, setCantidadSeleccionada] = useState(0);
  const [pedidoItems, setPedidoItems] = useState([]);
  const [comentarios, setComentarios] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const [token, setToken] = useState("");
  const [tokenValido, setTokenValido] = useState(false);
  const [vendedor, setVendedor] = useState(null);

  useEffect(() => {
    fetch(CLIENTES_CSV_URL)
      .then((res) => res.text())
      .then((data) => setClientes(csvToJson(data)));

    fetch(PRODUCTOS_CSV_URL)
      .then((res) => res.text())
      .then((data) => setProductos(csvToJson(data)));
  }, []);

  const opcionesClientes = clientes.map((cliente) => ({
    value: cliente["codigo"],
    label: `${cliente["cliente"]} - ${cliente["codigo"]}`,
  }));

  const opcionesProductos = productos.map((producto) => {
    const precioStr = producto["PRECIO UNIDAD"]?.replace(/[^0-9.]/g, "").trim();
    const precio = parseFloat(precioStr);
    return {
      value: producto["CODIGO"],
      label: `${producto["PRODUCTO"]} | $${isNaN(precio) ? "0.00" : precio.toFixed(2)}`,
      precio: isNaN(precio) ? 0 : precio,
    };
  });

  const agregarProducto = () => {
    if (!productoSeleccionado || cantidadSeleccionada < 0) return;
    const yaExiste = pedidoItems.find((item) => item.value === productoSeleccionado.value);
    if (yaExiste) return alert("Producto ya agregado");

    setPedidoItems([
      ...pedidoItems,
      { ...productoSeleccionado, cantidad: cantidadSeleccionada },
    ]);
    setProductoSeleccionado(null);
    setCantidadSeleccionada(0);
  };

  const actualizarCantidad = (index, nuevaCantidad) => {
    const nuevosItems = [...pedidoItems];
    nuevosItems[index].cantidad = parseInt(nuevaCantidad) || 0;
    setPedidoItems(nuevosItems);
  };

  const eliminarProducto = (index) => {
    const nuevosItems = pedidoItems.filter((_, i) => i !== index);
    setPedidoItems(nuevosItems);
  };

  const calcularTotal = () => {
    return pedidoItems.reduce((total, item) => total + item.precio * item.cantidad, 0);
  };

  const enviarPedido = () => {
    if (!clienteSeleccionado || pedidoItems.length === 0 || !vendedor) {
      alert("Completa cliente, productos y vendedor primero");
      return;
    }

    const pedido = {
      cliente: clienteSeleccionado.label,
      vendedor,
      comentarios,
      items: pedidoItems.map((item) => ({
        codigo: item.value,
        producto: item.label.split(" | ")[0],
        cantidad: item.cantidad,
        precioUnitario: item.precio,
        total: (item.precio * item.cantidad).toFixed(2),
      })),
      total: calcularTotal().toFixed(2),
    };

    const params = new URLSearchParams({
      cliente: pedido.cliente,
      vendedor: pedido.vendedor,
      comentarios: pedido.comentarios,
      items: JSON.stringify(pedido.items),
      total: pedido.total,
    });

    fetch(`${APPS_SCRIPT_URL}?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setMensajeExito("✅ Pedido enviado correctamente");

          setTimeout(() => {
            setMensajeExito("");
            setClienteSeleccionado(null);
            setProductoSeleccionado(null);
            setCantidadSeleccionada(0);
            setPedidoItems([]);
            setComentarios("");
            setVendedor(null);
            setToken("");
            setTokenValido(false);
          }, 2500);
        } else {
          alert("❌ Error al enviar pedido: " + data.message);
        }
      })
      .catch((err) => alert("❌ Error al enviar: " + err.message));
  };

  if (!tokenValido) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="bg-white p-6 rounded shadow-md w-full max-w-sm">
          <h2 className="text-lg font-bold mb-3 text-center">Ingrese Token</h2>
          <input
            type="password" // 🔹 Ahora muestra asteriscos
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Token..."
            className="w-full px-3 py-2 border rounded mb-3"
          />
          <button
            onClick={() => {
              if (TOKENS_VALIDOS.includes(token.trim())) {
                setTokenValido(true);
              } else {
                alert("Token inválido");
              }
            }}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Validar
          </button>
        </div>
      </div>
    );
  }

  if (!vendedor) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="bg-white p-6 rounded shadow-md w-full max-w-sm">
          <h2 className="text-lg font-bold mb-3 text-center">¿Quién toma el pedido?</h2>
          <Select
            options={NOMBRES_VENDEDORES.map((nombre) => ({ label: nombre, value: nombre }))}
            onChange={(e) => setVendedor(e.value)}
            placeholder="Seleccionar nombre..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-center mb-1 uppercase">TOMA PEDIDOS</h2>
        <p className="text-center text-sm text-gray-600 mb-5">
          DISTRIBUIDORA SALVADOREÑA DE PRODUCTOS S.A DE C.V
        </p>

        {mensajeExito && (
          <div className="mb-4 p-3 text-green-800 bg-green-100 border border-green-300 rounded text-center text-sm">
            {mensajeExito}
          </div>
        )}

        <div className="mb-4">
          <label className="block mb-1 font-medium">Seleccionar Cliente:</label>
          <Select
            options={opcionesClientes}
            value={clienteSeleccionado}
            onChange={setClienteSeleccionado}
            placeholder="Buscar cliente..."
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Seleccionar Producto:</label>
          <Select
            options={opcionesProductos}
            value={productoSeleccionado}
            onChange={setProductoSeleccionado}
            placeholder="Buscar producto..."
          />
          <div className="flex items-center mt-2">
            <input
              type="number"
              min="1"
              value={cantidadSeleccionada}
              onChange={(e) => setCantidadSeleccionada(parseInt(e.target.value) || 1)}
              className="w-20 px-2 py-1 border rounded mr-4"
              placeholder="Cantidad"
            />
            <button
              onClick={agregarProducto}
              className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Agregar
            </button>
          </div>
        </div>

        {/* 🔹 Campo de comentarios */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Comentarios:</label>
          <textarea
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
            placeholder="Notas adicionales sobre el pedido..."
            className="w-full px-3 py-2 border rounded"
          ></textarea>
        </div>

        {pedidoItems.length > 0 && (
          <div className="border rounded p-4 bg-gray-50 text-sm">
            <h4 className="font-semibold text-lg mb-3 text-center">Resumen del Pedido</h4>
            <ul className="mb-3 space-y-2">
              {pedidoItems.map((item, index) => (
                <li key={index} className="flex justify-between items-center text-xs">
                  <span>{item.label}</span>
                  <div className="flex items-center space-x-2">
                    <span>Cant:</span>
                    <input
                      type="number"
                      min="1"
                      value={item.cantidad}
                      onChange={(e) => actualizarCantidad(index, e.target.value)}
                      className="w-12 px-1 border rounded"
                    />
                    <span>Total: ${ (item.precio * item.cantidad).toFixed(2) }</span>
                    <button
                      onClick={() => eliminarProducto(index)}
                      className="text-red-600 hover:underline"
                    >
                      Borrar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mb-3 font-bold text-center text-base">Total Pedido: ${calcularTotal().toFixed(2)}</p>
            <div className="text-center">
              <button
                onClick={() => {
                  if (window.confirm("¿Estás seguro de enviar este pedido?")) {
                    enviarPedido();
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Enviar Pedido
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
