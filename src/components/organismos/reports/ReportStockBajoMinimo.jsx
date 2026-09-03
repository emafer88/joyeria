import {
  Document,
  Page,
  Text,
  View,
  PDFViewer,
  StyleSheet,
} from "@react-pdf/renderer";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import { useReportStore } from "../../../store/ReportStore";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { useReportesFiltrosStore } from "../../../store/ReportesFiltrosStore";

// Formatea números; deja pasar strings/null sin romper con .toFixed.
const num = (v) => (typeof v === "number" ? v.toFixed(2) : v ?? "-");

const ReportStockBajoMinimo = () => {
  const { reportStockBajoMinimo } = useReportStore();
  const { dataempresa } = useEmpresaStore();
  const { sucursalSel, almacenSel } = useReportesFiltrosStore();

  const params = {
    _id_empresa: dataempresa?.id,
    sucursal_id: sucursalSel?.id ?? null,
    almacen_id: almacenSel?.id ?? null,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["report Stock Por Almacen Sucursal Bajo Minimo", params],
    queryFn: () => reportStockBajoMinimo(params),
    enabled: !!dataempresa?.id,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return <div>Cargando...</div>;
  }
  if (error) {
    return <span>Error {error.message}</span>;
  }

  const styles = StyleSheet.create({
    page: {
      flexDirection: "row",
      position: "relative",
      padding: 20,
    },
    section: {
      margin: 10,
      padding: 10,
      flexGrow: 1,
    },
    table: {
      width: "100%",
      margin: "auto",
      marginTop: 10,
      borderTop: 1,
      borderRight: 1,
      borderColor: "#000",
    },
    row: {
      flexDirection: "row",
      borderBottom: 1,
      borderBottomColor: "#000",
      alignItems: "center",
      height: 24,
      borderLeftColor: "#000",
      borderLeft: 1,
      textAlign: "left",
      justifyContent: "flex-start",
    },
    cell: {
      flex: 1,
      textAlign: "center",
      fontFamily: "Courier",
      fontSize: 9,
      padding: 3,
      borderRightColor: "#000",
      borderRight: 0,
    },
    headerCell: {
      flex: 1,

      fontWeight: "bold",
      fontFamily: "Courier",
      textAlign: "center",
      fontSize: 9,
      padding: 3,
      borderRightColor: "#000",
      borderRight: 0,
    },
    reportInfo: {
      fontSize: 12,
      fontFamily: "Courier",
      marginBottom: 5,
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      textAlign: "left",
      marginBottom: 10,
      fontFamily: "Courier",
    },
    subTitle: {
      fontSize: 12,
      fontFamily: "Courier",
      marginBottom: 5,
      textAlign: "left",
    },
    totalRow: {
      fontWeight: "bold",
      textAlign: "right",
      fontSize: 12,
      marginTop: 10,
      fontFamily: "Courier",
    },
    codeCell: {
      flex: 0.8,
      textAlign: "center",
      fontFamily: "Courier",
      fontSize: 9,
      padding: 3,
    },
    descriptionCell: {
      flex: 2,
      textAlign: "left",
      fontFamily: "Courier",
      fontSize: 9,
      padding: 3,
      paddingLeft: 5,
    },
    numberCell: {
      flex: 0.8,
      textAlign: "center",
      fontFamily: "Courier",
      fontSize: 9,
      padding: 3,
      paddingRight: 5,
    },
    headerCodeCell: {
      flex: 0.8,

      fontWeight: "bold",
      fontFamily: "Courier",
      textAlign: "center",
      fontSize: 9,
      padding: 3,
    },
    headerDescriptionCell: {
      flex: 2,
      fontWeight: "bold",
      fontFamily: "Courier",
      textAlign: "center",
      fontSize: 9,
      padding: 3,
    },
    headerNumberCell: {
      flex: 0.8,

      fontWeight: "bold",
      fontFamily: "Courier",
      textAlign: "center",
      fontSize: 9,
      padding: 3,
    },
    totalLabelCell: {
      flex: 2.8,
      textAlign: "right",
      fontFamily: "Courier",
      fontWeight: "bold",
      fontSize: 9,
      padding: 3,
      paddingRight: 5,
    },
  });

  const renderTableHeader = () => (
    <View style={styles.row}>
      <Text style={styles.headerCodeCell}>CÓDIGO</Text>
      <Text style={styles.headerDescriptionCell}>PRODUCTO</Text>
      <Text style={styles.headerNumberCell}>STOCK</Text>
      <Text style={styles.headerNumberCell}>STOCK MINIMO</Text>
      <Text style={styles.headerNumberCell}>PRECIO COSTO</Text>
      <Text style={styles.headerNumberCell}>TOTAL</Text>
    </View>
  );

  const renderTableRow = (rowData, i) => (
    <View style={styles.row} key={rowData.codigo_articulo ?? i}>
      <Text style={styles.codeCell}>{rowData.codigo_articulo}</Text>
      <Text style={styles.descriptionCell}>{rowData.descripcion_articulo}</Text>
      <Text style={styles.numberCell}>{num(rowData.stock)}</Text>
      <Text style={styles.numberCell}>{num(rowData.stock_minimo)}</Text>
      <Text style={styles.numberCell}>{num(rowData.precio_costo)}</Text>
      <Text style={styles.numberCell}>{num(rowData.total)}</Text>
    </View>
  );

  const rows = data ?? [];
  const totalStock = rows.reduce((acc, item) => acc + Number(item.stock || 0), 0);
  const totalValor = rows.reduce((acc, item) => acc + Number(item.total || 0), 0);

  const currentDate = new Date();
  const formattedDate = `${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}`;

  return (
    <Container className="main">
      <PDFViewer className="pdfviewer">
        <Document title="Reporte de stock bajo mínimo">
          <Page size="A4" orientation="portrait">
            <View style={styles.page}>
              <View style={styles.section}>
                {/* ENCABEZADO */}
                <Text style={styles.title}>Reporte de stock bajo mínimo</Text>
                <Text style={styles.subTitle}>
                  Fecha y Hora del reporte: {formattedDate}
                </Text>
                <Text style={styles.subTitle}>
                  Sucursal: {sucursalSel?.nombre || "Todas"}
                </Text>
                <Text style={styles.subTitle}>
                  Almacén: {almacenSel?.nombre || "Todos"}
                </Text>

                <View style={styles.table}>
                  {renderTableHeader()}
                  {rows.length === 0 && (
                    <View style={styles.row}>
                      <Text style={styles.descriptionCell}>
                        No hay productos por debajo del stock mínimo.
                      </Text>
                    </View>
                  )}
                  {rows.map((item, i) => renderTableRow(item, i))}

                  {/* Total general */}
                  <View style={styles.row}>
                    <Text style={styles.totalLabelCell}>TOTAL</Text>
                    <Text style={styles.numberCell}>{totalStock.toFixed(2)}</Text>
                    <Text style={styles.numberCell}></Text>
                    <Text style={styles.numberCell}></Text>
                    <Text style={styles.numberCell}>{totalValor.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            </View>
          </Page>
        </Document>
      </PDFViewer>
    </Container>
  );
};

const Container = styled.main`
  width: 100%;
  position: relative;
  height: 80vh;
  .pdfviewer {
    width: 100%;
    height: 100%;
  }
`;

export default ReportStockBajoMinimo;
