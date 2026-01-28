export default function CourseDetailPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <div>
      <h1>Course Detail: {params.id}</h1>
    </div>
  )
}
