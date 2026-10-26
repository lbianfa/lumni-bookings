import { Link } from '@tanstack/react-router'
import {
  createColumnHelper,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import { formatDateLabel } from '../../../quotes/business-time'
import { SIZE_LABELS, formatCop } from '../../../quotes/format'
import type { AdminBookingListItem } from '../../booking.types'
import { StatusBadge } from '../status-badge'

// Rows arrive filtered, ordered and paged by the API, so the table only lays out columns.
const features = tableFeatures({})
const helper = createColumnHelper<typeof features, AdminBookingListItem>()
const columns = helper.columns([
  helper.accessor('reference', {
    header: 'Booking',
    cell: ({ row, getValue }) => (
      <Link
        to="/admin/bookings/$bookingId"
        params={{ bookingId: row.original.id }}
        className="font-mono font-medium [overflow-wrap:anywhere] text-brand-strong hover:text-brand-deep"
      >
        {getValue()}
      </Link>
    ),
  }),
  helper.accessor((booking) => booking.customer.fullName, {
    id: 'customer',
    header: 'Customer',
    cell: ({ getValue }) => <span className="font-semibold">{getValue()}</span>,
  }),
  helper.accessor(
    (booking) => `${booking.room.name} (${SIZE_LABELS[booking.room.size]})`,
    { id: 'room', header: 'Room' },
  ),
  helper.display({
    id: 'schedule',
    header: 'Schedule',
    cell: ({ row }) => (
      <span className="whitespace-nowrap">
        {formatDateLabel(row.original.date)} ·{' '}
        <span className="font-mono">
          {row.original.startTime}–{row.original.endTime}
        </span>
      </span>
    ),
  }),
  helper.accessor('total', {
    header: 'Total',
    cell: ({ getValue }) => formatCop(getValue()),
  }),
  helper.accessor('status', {
    header: 'Status',
    cell: ({ getValue }) => <StatusBadge status={getValue()} variant="list" />,
  }),
])

const RIGHT_ALIGNED = new Set(['total'])
const CELL_CLASS = 'border-b border-line px-4 py-3.5'

interface BookingsTableProps {
  bookings: AdminBookingListItem[]
  /** A new page or filter is loading: the rows shown are the previous ones. */
  stale: boolean
}

export function BookingsTable({ bookings, stale }: BookingsTableProps) {
  const table = useTable({
    features,
    columns,
    data: bookings,
    getRowId: (booking) => booking.id,
  })
  const rows = table.getRowModel().rows

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white">
      <table
        aria-busy={stale}
        className={`w-full min-w-[900px] border-collapse text-sm transition-opacity ${stale ? 'opacity-60' : ''}`}
      >
        <caption className="sr-only">
          Bookings, filtered by status and room
        </caption>
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id} className="bg-canvas">
              {group.headers.map((header) => (
                <th
                  key={header.id}
                  scope="col"
                  className={`${CELL_CLASS} text-xs font-bold tracking-[0.04em] text-ink-soft uppercase ${RIGHT_ALIGNED.has(header.column.id) ? 'text-right' : 'text-left'}`}
                >
                  {header.isPlaceholder ? null : (
                    <table.FlexRender header={header} />
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <tr key={row.id}>
                {row.getAllCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={`${CELL_CLASS} ${RIGHT_ALIGNED.has(cell.column.id) ? 'text-right font-mono whitespace-nowrap' : ''}`}
                  >
                    <table.FlexRender cell={cell} />
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-muted"
              >
                No bookings match these filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
