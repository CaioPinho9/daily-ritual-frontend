type PageStateProps = {
  title: string
  description: string
}

export function PageState({ title, description }: PageStateProps) {
  return (
    <main className="page-state">
      <div className="page-state__card">
        <div className="spinner" />
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </main>
  )
}
